import { z } from "zod"

export const createAuditSchema = z.object({
    websiteUrl: z.string().url("Please enter a valid website URL."),
    businessType: z.enum([
        "LOCAL_SERVICE",
        "B2B_SERVICE",
        "AGENCY_CONSULTING",
        "OTHER_SERVICE",
    ]),
    manualContext: z.string().max(5000).optional(),
})

export type CreateAuditInput = z.infer<typeof createAuditSchema>