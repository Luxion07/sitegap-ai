import { generateReport } from "@/modules/ai/report-generator"
import { buildHtmlFaqBlock } from "@/modules/export/html-faq-export"
import { buildMarkdownReport } from "@/modules/export/markdown-export"
import { scrapeHomepage } from "@/modules/scraping/scraper.service"

import { BUSINESS_TYPE_LABELS } from "./business-type-labels"
import { createAudit, findAuditById, updateAudit } from "./audit.repository"
import { CreateAuditInput } from "./audit.schemas"
import { enqueueAuditJob } from "../queue/audit-queue"

const FALLBACK_SCRAPE_ERROR =
  "We could not read this website. Please try again."
const FALLBACK_GENERATION_ERROR = "Report generation failed. Please try again."


export async function createAuditService(input: CreateAuditInput) {
  const audit = await createAudit({
    status: "PROCESSING",
    websiteUrl: input.websiteUrl,
    businessType: input.businessType,
    manualContext: input.manualContext,
  })

  try {
    await enqueueAuditJob(audit.id)
    return audit
  } catch (error) {
    await updateAudit(audit.id, {
      status: "FAILED",
      statusMessage: "Could not queue audit for processing. Please try again.",
    })
    throw error
  }
}

export async function processAuditJob(auditId: string) {
  const audit = await findAuditById(auditId)
  if (!audit) {
    throw new Error(`Audit ${auditId} not found`)
  }

  if (audit.status === "READY") {
    return audit
  }

  let sourceText: string
  try {
    sourceText = await scrapeHomepage(audit.websiteUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : FALLBACK_SCRAPE_ERROR
    throw new Error(message)
  }

  await updateAudit(audit.id, { sourceText })

  try {
    const report = await generateReport({
      websiteUrl: audit.websiteUrl,
      businessType: audit.businessType,
      manualContext: audit.manualContext ?? undefined,
      extractedText: sourceText,
    })

    const markdownReport = buildMarkdownReport(report, {
      websiteUrl: audit.websiteUrl,
      businessTypeLabel: BUSINESS_TYPE_LABELS[audit.businessType],
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
      statusMessage: null,
      reportJson: report,
      previewJson,
      markdownReport,
      htmlFaqBlock,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : FALLBACK_GENERATION_ERROR
    throw new Error(message)
  }
}

export async function markAuditFailed(auditId: string, errorMessage?: string) {
  return updateAudit(auditId, {
    status: "FAILED",
    statusMessage: errorMessage || FALLBACK_GENERATION_ERROR,
  })
}