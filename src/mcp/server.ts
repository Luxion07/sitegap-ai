import { retrieveTips } from "@/modules/knowledge/retrieval"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "sitegap-ai",
    version: "0.1.0",
  })

  // 1. search_tips
  server.registerTool(
    "search_tips",
    {
      description:
        "Search curated business tips by query and business category",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .max(8000)
          .describe("Search query, e.g. service description or keywords"),
        businessType: z
          .enum([
            "LOCAL_SERVICE",
            "B2B_SERVICE",
            "AGENCY_CONSULTING",
            "OTHER_SERVICE",
          ])
          .describe("Business category"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .default(5)
          .describe("Max number of tips to return"),
      }),
    },
    async ({ query, businessType, limit }) => {
      try {
        const tips = await retrieveTips({
          pageText: query,
          businessType,
          limit,
        })
        if (tips.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No tips found for this query and business type.",
              },
            ],
          }
        }
        return { content: tips.map((t) => ({ type: "text", text: t })) }
      } catch (error) {
        console.error("Error occurred while searching tips:", error)
        return {
          isError: true,
          content: [
            { type: "text", text: "An error occurred while searching tips." },
          ],
        }
      }
    }
  )

  return server
}
