import { describe, expect, it, vi, beforeEach } from "vitest"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"

import { createMcpServer } from "./server"
import { retrieveTips } from "@/modules/knowledge/retrieval"
import { createAuditService } from "@/modules/audit/audit.service"
import { findAuditById } from "@/modules/audit/audit.repository"

vi.mock("@/modules/knowledge/retrieval", () => ({
  retrieveTips: vi.fn(),
}))

vi.mock("@/modules/audit/audit.service", () => ({
  createAuditService: vi.fn(),
}))

vi.mock("@/modules/audit/audit.repository", () => ({
  findAuditById: vi.fn(),
}))

async function createTestClient() {
  const server = createMcpServer()
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)

  const client = new Client({ name: "test-client", version: "1.0.0" })
  await client.connect(clientTransport)
  return client
}

function getTextBlocks(
  result: Record<string, unknown>
): Array<{ type: "text"; text: string }> {
  if ("content" in result && Array.isArray(result.content)) {
    return result.content as Array<{ type: "text"; text: string }>
  }
  return []
}

describe("MCP Server Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("search_tips", () => {
    it("returns formatted tips on success", async () => {
      vi.mocked(retrieveTips).mockResolvedValueOnce([
        "Tip 1: response time",
        "Tip 2: pricing",
      ])
      const client = await createTestClient()

      const result = await client.callTool({
        name: "search_tips",
        arguments: { query: "emergency leak", businessType: "LOCAL_SERVICE" },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBeFalsy()
      expect(content).toHaveLength(1)
      expect(content[0]).toEqual({
        type: "text",
        text: "Tip 1: response time\n\nTip 2: pricing",
      })
    })

    it("returns fallback message when no tips are found", async () => {
      vi.mocked(retrieveTips).mockResolvedValueOnce([])
      const client = await createTestClient()

      const result = await client.callTool({
        name: "search_tips",
        arguments: { query: "unknown topic", businessType: "OTHER_SERVICE" },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBeFalsy()
      expect(content[0]).toEqual({
        type: "text",
        text: "No tips found for this query and business type.",
      })
    })

    it("returns tool error when retrieval throws an exception", async () => {
      vi.mocked(retrieveTips).mockRejectedValueOnce(
        new Error("Gemini API down")
      )
      const client = await createTestClient()

      const result = await client.callTool({
        name: "search_tips",
        arguments: { query: "test", businessType: "LOCAL_SERVICE" },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBe(true)
      expect(content[0]).toEqual({
        type: "text",
        text: "An error occurred while searching tips.",
      })
    })

    it("rejects invalid businessType with validation error", async () => {
      const client = await createTestClient()

      const result = await client.callTool({
        name: "search_tips",
        arguments: { query: "test", businessType: "INVALID_CATEGORY" },
      })

      expect(result.isError).toBe(true)
      expect(retrieveTips).not.toHaveBeenCalled()
    })

    it("rejects empty query with validation error", async () => {
      const client = await createTestClient()

      const result = await client.callTool({
        name: "search_tips",
        arguments: { query: "", businessType: "LOCAL_SERVICE" },
      })

      expect(result.isError).toBe(true)
      expect(retrieveTips).not.toHaveBeenCalled()
    })
  })

  describe("create_audit", () => {
    it("returns audit summary when audit is created successfully", async () => {
      vi.mocked(createAuditService).mockResolvedValueOnce({
        id: "audit-123",
        status: "READY",
        statusMessage: null,
      } as unknown as Awaited<ReturnType<typeof createAuditService>>)
      const client = await createTestClient()

      const result = await client.callTool({
        name: "create_audit",
        arguments: {
          websiteUrl: "https://example.com",
          businessType: "LOCAL_SERVICE",
        },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBeFalsy()
      expect(content).toHaveLength(1)

      const data = JSON.parse(content[0].text)
      expect(data).toEqual({
        id: "audit-123",
        status: "READY",
        statusMessage: null,
      })
    })

    it("returns tool error when audit status is FAILED (e.g. SSRF blocked)", async () => {
      vi.mocked(createAuditService).mockResolvedValueOnce({
        id: "audit-failed-1",
        status: "FAILED",
        statusMessage: "Requests to private networks or localhost are blocked.",
      } as unknown as Awaited<ReturnType<typeof createAuditService>>)
      const client = await createTestClient()

      const result = await client.callTool({
        name: "create_audit",
        arguments: {
          websiteUrl: "https://blocked-site.com",
          businessType: "LOCAL_SERVICE",
        },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBe(true)
      expect(content[0]).toEqual({
        type: "text",
        text: "Requests to private networks or localhost are blocked.",
      })
    })

    it("rejects invalid websiteUrl schema", async () => {
      const client = await createTestClient()

      const result = await client.callTool({
        name: "create_audit",
        arguments: {
          websiteUrl: "not-a-valid-url",
          businessType: "B2B_SERVICE",
        },
      })

      expect(result.isError).toBe(true)
      expect(createAuditService).not.toHaveBeenCalled()
    })

    it("returns safe tool error when createAuditService throws an unexpected error", async () => {
      vi.mocked(createAuditService).mockRejectedValueOnce(
        new Error("Database crash")
      )
      const client = await createTestClient()

      const result = await client.callTool({
        name: "create_audit",
        arguments: {
          websiteUrl: "https://example.com",
          businessType: "B2B_SERVICE",
        },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBe(true)
      expect(content[0]).toEqual({
        type: "text",
        text: "An error occurred while creating the audit.",
      })
    })
  })

  describe("get_audit", () => {
    it("returns full audit data and report when status is READY", async () => {
      const mockAudit = {
        id: "audit-abc",
        websiteUrl: "https://mytrade.com",
        businessType: "LOCAL_SERVICE",
        status: "READY",
        statusMessage: null,
        createdAt: new Date("2026-10-16T12:00:00Z"),
        reportJson: {
          clarityScore: { overall: 85 },
          businessSummary: "Plumbing services",
        },
      }
      vi.mocked(findAuditById).mockResolvedValueOnce(
        mockAudit as unknown as Awaited<ReturnType<typeof findAuditById>>
      )
      const client = await createTestClient()

      const result = await client.callTool({
        name: "get_audit",
        arguments: { id: "audit-abc" },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBeFalsy()
      const data = JSON.parse(content[0].text)
      expect(data.id).toBe("audit-abc")
      expect(data.status).toBe("READY")
      expect(data.report).toEqual(mockAudit.reportJson)
    })

    it("returns null report when audit status is not READY (e.g. PROCESSING)", async () => {
      const mockAudit = {
        id: "audit-processing",
        websiteUrl: "https://mytrade.com",
        businessType: "LOCAL_SERVICE",
        status: "PROCESSING",
        statusMessage: null,
        createdAt: new Date("2026-10-16T12:00:00Z"),
        reportJson: null,
      }
      vi.mocked(findAuditById).mockResolvedValueOnce(
        mockAudit as unknown as Awaited<ReturnType<typeof findAuditById>>
      )
      const client = await createTestClient()

      const result = await client.callTool({
        name: "get_audit",
        arguments: { id: "audit-processing" },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBeFalsy()
      const data = JSON.parse(content[0].text)
      expect(data.status).toBe("PROCESSING")
      expect(data.report).toBeNull()
    })

    it("returns tool error when audit is not found", async () => {
      vi.mocked(findAuditById).mockResolvedValueOnce(null)
      const client = await createTestClient()

      const result = await client.callTool({
        name: "get_audit",
        arguments: { id: "non-existent-id" },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBe(true)
      expect(content[0]).toEqual({
        type: "text",
        text: "Audit not found: non-existent-id",
      })
    })

    it("rejects empty id with validation error", async () => {
      const client = await createTestClient()

      const result = await client.callTool({
        name: "get_audit",
        arguments: { id: "" },
      })

      expect(result.isError).toBe(true)
      expect(findAuditById).not.toHaveBeenCalled()
    })

    it("returns safe tool error when repository throws an error", async () => {
      vi.mocked(findAuditById).mockRejectedValueOnce(new Error("DB timeout"))
      const client = await createTestClient()

      const result = await client.callTool({
        name: "get_audit",
        arguments: { id: "any-id" },
      })

      const content = getTextBlocks(result)
      expect(result.isError).toBe(true)
      expect(content[0]).toEqual({
        type: "text",
        text: "An error occurred while fetching the audit.",
      })
    })
  })
})
