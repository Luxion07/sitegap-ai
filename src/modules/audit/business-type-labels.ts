import type { BusinessType } from "@prisma/client"

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  LOCAL_SERVICE: "Local service business",
  B2B_SERVICE: "B2B service company",
  AGENCY_CONSULTING: "Agency / consulting",
  OTHER_SERVICE: "Other service business",
}
