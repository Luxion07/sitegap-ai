import { generateReport } from "@/modules/ai/report-generator"
import { buildHtmlFaqBlock } from "@/modules/export/html-faq-export"
import { buildMarkdownReport } from "@/modules/export/markdown-export"
import { scrapeHomepage } from "@/modules/scraping/scraper.service"

import { BUSINESS_TYPE_LABELS } from "./business-type-labels"
import { createAudit, updateAudit } from "./audit.repository"
import { CreateAuditInput } from "./audit.schemas"

const FALLBACK_SCRAPE_ERROR =
  "We could not read this website. Please try again."
const FALLBACK_GENERATION_ERROR = "Report generation failed. Please try again."

export async function createAuditService(input: CreateAuditInput) {
  const audit = await createAudit({
    websiteUrl: input.websiteUrl,
    businessType: input.businessType,
    manualContext: input.manualContext,
  })

  let sourceText: string
  try {
    sourceText = await scrapeHomepage(input.websiteUrl)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : FALLBACK_SCRAPE_ERROR
    return await updateAudit(audit.id, {
      status: "FAILED",
      statusMessage: message,
    })
  }

  await updateAudit(audit.id, { sourceText })

  try {
    const report = await generateReport({
      websiteUrl: input.websiteUrl,
      businessType: input.businessType,
      manualContext: input.manualContext,
      extractedText: sourceText,
    })

    const markdownReport = buildMarkdownReport(report, {
      websiteUrl: input.websiteUrl,
      businessTypeLabel: BUSINESS_TYPE_LABELS[input.businessType],
      generatedAt: new Date(),
    })
    const htmlFaqBlock = buildHtmlFaqBlock(report)
    const previewJson = {
      clarityScoreOverall: report.clarityScore.overall,
      businessSummary: report.businessSummary,
      missingQuestionsCount: report.missingQuestions.length,
      faqCount: report.readyFaq.length,
    }

    return await updateAudit(audit.id, {
      status: "READY",
      reportJson: report,
      previewJson,
      markdownReport,
      htmlFaqBlock,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : FALLBACK_GENERATION_ERROR
    return await updateAudit(audit.id, {
      status: "FAILED",
      statusMessage: message,
    })
  }
}
