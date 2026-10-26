import { beforeEach, describe, expect, it, vi } from "vitest"

import { generateReport } from "@/modules/ai/report-generator"
import type { Report } from "@/modules/ai/schemas"
import { scrapeHomepage } from "@/modules/scraping/scraper.service"
import { enqueueAuditJob } from "../queue/audit-queue"
import { createAudit, findAuditById, updateAudit } from "./audit.repository"
import {
  createAuditService,
  markAuditFailed,
  processAuditJob,
} from "./audit.service"

vi.mock("./audit.repository", () => ({
  createAudit: vi.fn(),
  findAuditById: vi.fn(),
  updateAudit: vi.fn(),
}))

vi.mock("../queue/audit-queue", () => ({
  enqueueAuditJob: vi.fn(),
}))

vi.mock("@/modules/scraping/scraper.service", () => ({
  scrapeHomepage: vi.fn(),
}))

vi.mock("@/modules/ai/report-generator", () => ({
  generateReport: vi.fn(),
}))

const sampleReport: Report = {
  analyzedScope: {
    pagesAnalyzed: ["https://example.com/"],
    note: "Homepage analyzed.",
  },
  clarityScore: {
    overall: 82,
    categories: [
      {
        key: "SCOPE",
        label: "Service Scope",
        status: "ANSWERED",
        priority: "HIGH",
        note: "Clear emergency plumbing headline.",
      },
    ],
  },
  businessSummary: {
    nameGuess: "Austin Emergency Plumbing",
    whatTheyDo: "Emergency plumbing and drain repair in Austin.",
    targetCustomers: "Homeowners in Austin, TX",
    detectedBusinessType: "LOCAL_SERVICE",
    confidence: "HIGH",
  },
  detectedOffers: [
    {
      title: "24/7 Emergency Plumbing",
      description: "Rapid response leak and drain repair.",
      evidence: "24/7 emergency dispatch banner on homepage.",
    },
  ],
  answeredQuestions: [
    {
      question: "Do you handle 24/7 emergencies?",
      answer: "Yes, we operate 24/7 across Austin.",
      evidence: "24/7 emergency dispatch banner on homepage.",
      confidence: "FOUND_ON_SITE",
    },
  ],
  missingQuestions: [
    {
      question: "What is the dispatch or call-out fee?",
      whyItMatters: "Customers hesitate to call without knowing the base cost.",
      priority: "HIGH",
      suggestedWebsiteSection: "Pricing & Estimates",
      suggestedAnswerGuidance: "State the flat diagnostic fee or free estimate policy.",
    },
  ],
  readyFaq: [
    {
      question: "How fast can a plumber arrive?",
      answer: "We dispatch a licensed technician within 60 minutes in Austin.",
      confidence: "FOUND_ON_SITE",
      needsBusinessConfirmation: false,
      sourceNote: "Stated on homepage hero section.",
    },
  ],
  websiteImprovements: [
    {
      title: "Add dispatch fee clarity",
      reason: "Reduces friction for emergency callers.",
      suggestedCopy: "Upfront diagnostic fee of $49 — waived with any repair.",
      priority: "HIGH",
    },
  ],
}

describe("audit.service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createAuditService", () => {
    it("creates a PROCESSING audit and enqueues a background job", async () => {
      const createdAudit = {
        id: "audit-1",
        status: "PROCESSING",
        websiteUrl: "https://example.com/",
        businessType: "LOCAL_SERVICE",
        manualContext: "Plumbing company",
      }
      vi.mocked(createAudit).mockResolvedValueOnce(
        createdAudit as unknown as Awaited<ReturnType<typeof createAudit>>
      )
      vi.mocked(enqueueAuditJob).mockResolvedValueOnce(undefined)

      const result = await createAuditService({
        websiteUrl: "https://example.com/",
        businessType: "LOCAL_SERVICE",
        manualContext: "Plumbing company",
      })

      expect(createAudit).toHaveBeenCalledWith({
        status: "PROCESSING",
        websiteUrl: "https://example.com/",
        businessType: "LOCAL_SERVICE",
        manualContext: "Plumbing company",
      })
      expect(enqueueAuditJob).toHaveBeenCalledWith("audit-1")
      expect(result).toEqual(createdAudit)
    })

    it("marks audit FAILED and rethrows if enqueueing to Redis fails", async () => {
      vi.mocked(createAudit).mockResolvedValueOnce({
        id: "audit-redis-down",
        status: "PROCESSING",
      } as unknown as Awaited<ReturnType<typeof createAudit>>)
      vi.mocked(enqueueAuditJob).mockRejectedValueOnce(
        new Error("Redis connection refused")
      )

      await expect(
        createAuditService({
          websiteUrl: "https://example.com/",
          businessType: "B2B_SERVICE",
        })
      ).rejects.toThrow("Redis connection refused")

      expect(updateAudit).toHaveBeenCalledWith("audit-redis-down", {
        status: "FAILED",
        statusMessage: "Could not queue audit for processing. Please try again.",
      })
    })
  })

  describe("processAuditJob", () => {
    it("throws when the audit ID does not exist", async () => {
      vi.mocked(findAuditById).mockResolvedValueOnce(null)

      await expect(processAuditJob("missing-id")).rejects.toThrow(
        "Audit missing-id not found"
      )
      expect(scrapeHomepage).not.toHaveBeenCalled()
    })

    it("returns early without scraping or calling LLM if audit is already READY (idempotency)", async () => {
      const readyAudit = {
        id: "audit-ready",
        status: "READY",
        websiteUrl: "https://example.com/",
        businessType: "LOCAL_SERVICE",
      }
      vi.mocked(findAuditById).mockResolvedValueOnce(
        readyAudit as unknown as Awaited<ReturnType<typeof findAuditById>>
      )

      const result = await processAuditJob("audit-ready")

      expect(result).toEqual(readyAudit)
      expect(scrapeHomepage).not.toHaveBeenCalled()
      expect(generateReport).not.toHaveBeenCalled()
      expect(updateAudit).not.toHaveBeenCalled()
    })

    it("scrapes homepage, generates report, and updates audit to READY", async () => {
      const processingAudit = {
        id: "audit-proc",
        status: "PROCESSING",
        websiteUrl: "https://example.com/",
        businessType: "LOCAL_SERVICE",
        manualContext: null,
      }
      const updatedReadyAudit = {
        ...processingAudit,
        status: "READY",
        reportJson: sampleReport,
      }

      vi.mocked(findAuditById).mockResolvedValueOnce(
        processingAudit as unknown as Awaited<ReturnType<typeof findAuditById>>
      )
      vi.mocked(scrapeHomepage).mockResolvedValueOnce(
        "Welcome to Austin Emergency Plumbing"
      )
      vi.mocked(generateReport).mockResolvedValueOnce(sampleReport)
      vi.mocked(updateAudit)
        .mockResolvedValueOnce(
          processingAudit as unknown as Awaited<ReturnType<typeof updateAudit>>
        )
        .mockResolvedValueOnce(
          updatedReadyAudit as unknown as Awaited<ReturnType<typeof updateAudit>>
        )

      const result = await processAuditJob("audit-proc")

      expect(scrapeHomepage).toHaveBeenCalledWith("https://example.com/")
      expect(updateAudit).toHaveBeenNthCalledWith(1, "audit-proc", {
        sourceText: "Welcome to Austin Emergency Plumbing",
      })
      expect(generateReport).toHaveBeenCalledWith({
        websiteUrl: "https://example.com/",
        businessType: "LOCAL_SERVICE",
        manualContext: undefined,
        extractedText: "Welcome to Austin Emergency Plumbing",
      })
      expect(updateAudit).toHaveBeenNthCalledWith(
        2,
        "audit-proc",
        expect.objectContaining({
          status: "READY",
          statusMessage: null,
          reportJson: sampleReport,
          previewJson: {
            clarityScoreOverall: 82,
            businessSummary: sampleReport.businessSummary,
            missingQuestionsCount: 1,
            faqCount: 1,
          },
          markdownReport: expect.stringContaining(
            "# Website FAQ & Content Gap Audit"
          ),
          htmlFaqBlock: expect.stringContaining("<section"),
        })
      )
      expect(result).toEqual(updatedReadyAudit)
    })

    it("rethrows scrape errors so BullMQ can retry the job", async () => {
      vi.mocked(findAuditById).mockResolvedValueOnce({
        id: "audit-scrape-err",
        status: "PROCESSING",
        websiteUrl: "https://example.com/",
        businessType: "LOCAL_SERVICE",
      } as unknown as Awaited<ReturnType<typeof findAuditById>>)
      vi.mocked(scrapeHomepage).mockRejectedValueOnce(
        new Error("Homepage fetch timed out.")
      )

      await expect(processAuditJob("audit-scrape-err")).rejects.toThrow(
        "Homepage fetch timed out."
      )
      expect(generateReport).not.toHaveBeenCalled()
    })

    it("rethrows report generation errors after saving sourceText so BullMQ can retry", async () => {
      vi.mocked(findAuditById).mockResolvedValueOnce({
        id: "audit-llm-err",
        status: "PROCESSING",
        websiteUrl: "https://example.com/",
        businessType: "B2B_SERVICE",
        manualContext: null,
      } as unknown as Awaited<ReturnType<typeof findAuditById>>)
      vi.mocked(scrapeHomepage).mockResolvedValueOnce("Extracted B2B text")
      vi.mocked(generateReport).mockRejectedValueOnce(
        new Error("LLM provider rate limited")
      )

      await expect(processAuditJob("audit-llm-err")).rejects.toThrow(
        "LLM provider rate limited"
      )
      expect(updateAudit).toHaveBeenCalledTimes(1)
      expect(updateAudit).toHaveBeenCalledWith("audit-llm-err", {
        sourceText: "Extracted B2B text",
      })
    })
  })

  describe("markAuditFailed", () => {
    it("updates audit status to FAILED with the provided error message", async () => {
      await markAuditFailed("audit-fail-1", "Custom failure message")

      expect(updateAudit).toHaveBeenCalledWith("audit-fail-1", {
        status: "FAILED",
        statusMessage: "Custom failure message",
      })
    })

    it("uses fallback message when errorMessage is empty", async () => {
      await markAuditFailed("audit-fail-2", "")

      expect(updateAudit).toHaveBeenCalledWith("audit-fail-2", {
        status: "FAILED",
        statusMessage: "Report generation failed. Please try again.",
      })
    })
  })
})
