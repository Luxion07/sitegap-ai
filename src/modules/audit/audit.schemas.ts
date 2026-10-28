import { z } from "zod"

export const createAuditSchema = z.object({
  websiteUrl: z.httpUrl("Please enter a valid website URL."),
  businessType: z.enum(
    ["LOCAL_SERVICE", "B2B_SERVICE", "AGENCY_CONSULTING", "OTHER_SERVICE"],
    "Please select a business type."
  ),
  manualContext: z.string().max(5000).optional(),
})

export const auditStatusFilterSchema = z
  .enum(["READY", "FAILED", "PROCESSING"])
  .optional()

export type CreateAuditInput = z.infer<typeof createAuditSchema>

type SearchParams = { [key: string]: string | string[] | undefined }

// Pre-fills the audit form from a "Try again" link (/?url=…&businessType=…).
// Query params are untrusted, so a value that wouldn't pass the form's own
// validation is dropped instead of being shown.
export function parseAuditPrefill(params: SearchParams): {
  websiteUrl: string
  businessType: CreateAuditInput["businessType"] | ""
} {
  const url = createAuditSchema.shape.websiteUrl.safeParse(params.url)
  const type = createAuditSchema.shape.businessType.safeParse(
    params.businessType
  )

  return {
    websiteUrl: url.success ? url.data : "",
    businessType: type.success ? type.data : "",
  }
}
