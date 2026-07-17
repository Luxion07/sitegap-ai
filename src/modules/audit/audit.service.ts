import { scrapeHomepage } from "@/modules/scraping/scraper.service"

import { createAudit, updateAudit } from "./audit.repository"
import { CreateAuditInput } from "./audit.schemas"

export async function createAuditService(input: CreateAuditInput) {
  const audit = await createAudit({
    websiteUrl: input.websiteUrl,
    businessType: input.businessType,
    manualContext: input.manualContext,
  })

  try {
    const sourceText = await scrapeHomepage(input.websiteUrl)
    return await updateAudit(audit.id, { sourceText })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "We could not read this website."
    return await updateAudit(audit.id, {
      status: "FAILED",
      statusMessage: message,
    })
  }
}
