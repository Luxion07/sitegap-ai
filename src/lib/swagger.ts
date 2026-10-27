import swaggerJsdoc from "swagger-jsdoc"

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SiteGap AI — Swagger API Docs",
      version: "1.0.0",
      description:
        "REST API documentation for SiteGap AI (website content-gap analysis, RAG-grounded FAQ generation, and background BullMQ job status).",
    },
    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],
    tags: [
      {
        name: "Audits",
        description: "Create website audits and poll background job status",
      },
      {
        name: "Exports",
        description: "Download generated reports in Markdown or HTML",
      },
      {
        name: "System",
        description: "Service health check",
      },
    ],
    components: {
      schemas: {
        BusinessType: {
          type: "string",
          enum: [
            "LOCAL_SERVICE",
            "B2B_SERVICE",
            "AGENCY_CONSULTING",
            "OTHER_SERVICE",
          ],
          example: "LOCAL_SERVICE",
        },
        AuditStatus: {
          type: "string",
          enum: ["PROCESSING", "READY", "FAILED"],
          example: "PROCESSING",
        },
        CreateAuditInput: {
          type: "object",
          required: ["websiteUrl", "businessType"],
          properties: {
            websiteUrl: {
              type: "string",
              format: "uri",
              example: "https://example.com",
            },
            businessType: {
              $ref: "#/components/schemas/BusinessType",
            },
            manualContext: {
              type: "string",
              maxLength: 2000,
              example: "24/7 emergency plumbing in Austin, TX.",
            },
          },
        },
        CreateAuditResponse: {
          type: "object",
          required: ["auditId", "status", "reportUrl"],
          properties: {
            auditId: {
              type: "string",
              example: "cmvpda1w50001ilrpg1mllcse",
            },
            status: {
              $ref: "#/components/schemas/AuditStatus",
            },
            reportUrl: {
              type: "string",
              example: "/audit/cmvpda1w50001ilrpg1mllcse",
            },
          },
        },
        AuditStatusResponse: {
          type: "object",
          required: ["id", "status", "statusMessage"],
          properties: {
            id: {
              type: "string",
              example: "cmvpda1w50001ilrpg1mllcse",
            },
            status: {
              $ref: "#/components/schemas/AuditStatus",
            },
            statusMessage: {
              type: "string",
              nullable: true,
              example: null,
            },
          },
        },
        ApiErrorBody: {
          type: "object",
          required: ["error", "message"],
          properties: {
            error: {
              type: "string",
              enum: [
                "INVALID_JSON",
                "INVALID_INPUT",
                "RATE_LIMITED",
                "NOT_FOUND",
                "INTERNAL_ERROR",
              ],
              example: "INVALID_INPUT",
            },
            message: {
              type: "string",
              example: "Please check the submitted values.",
            },
            issues: {
              type: "array",
              items: {
                type: "object",
                required: ["field", "message"],
                properties: {
                  field: { type: "string", example: "websiteUrl" },
                  message: {
                    type: "string",
                    example:
                      "Enter a valid URL starting with http:// or https://.",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/app/api/**/*.ts"],
}

export function getSwaggerSpec() {
  return swaggerJsdoc(options)
}
