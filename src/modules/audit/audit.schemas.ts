import { z } from "zod"

export const createAuditSchema = z.object({
  websiteUrl: z.url("Please enter a valid website URL."),
  businessType: z.enum(
    ["LOCAL_SERVICE", "B2B_SERVICE", "AGENCY_CONSULTING", "OTHER_SERVICE"],
    "Please select a business type."
  ),
  manualContext: z.string().max(5000).optional(),
})

export type CreateAuditInput = z.infer<typeof createAuditSchema>
