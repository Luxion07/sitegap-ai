import type { Report } from "@/modules/ai/schemas"

import { buildHtmlFaqBlock } from "./html-faq-export"

export function buildMarkdownReport(
  report: Report,
  meta: { websiteUrl: string; businessTypeLabel: string; generatedAt: Date }
): string {
  const lines: string[] = []

  lines.push("# Website FAQ & Content Gap Audit")
  lines.push("")
  lines.push(`Website: ${meta.websiteUrl}`)
  lines.push(`Business type: ${meta.businessTypeLabel}`)
  lines.push(`Generated: ${meta.generatedAt.toISOString().slice(0, 10)}`)
  lines.push("")

  lines.push("## 1. Business Summary")
  lines.push("")
  lines.push(report.businessSummary.whatTheyDo)
  lines.push("")
  lines.push(`Target customers: ${report.businessSummary.targetCustomers}`)
  lines.push("")

  lines.push("## 2. Detected Services / Offers")
  lines.push("")
  for (const offer of report.detectedOffers) {
    lines.push(`- **${offer.title}** — ${offer.description}`)
  }
  lines.push("")

  lines.push("## 3. Questions Already Answered")
  lines.push("")
  for (const item of report.answeredQuestions) {
    lines.push(`- **${item.question}** — ${item.answer}`)
  }
  lines.push("")

  lines.push("## 4. Missing Visitor Questions")
  lines.push("")
  for (const item of report.missingQuestions) {
    lines.push(
      `- **${item.question}** (${item.priority}) — ${item.whyItMatters}`
    )
  }
  lines.push("")

  lines.push("## 5. Ready-to-Use FAQ")
  lines.push("")
  for (const item of report.readyFaq) {
    lines.push(`**Q: ${item.question}**`)
    lines.push(`A: ${item.answer}`)
    lines.push("")
  }

  lines.push("## 6. Website Improvement Checklist")
  lines.push("")
  for (const item of report.websiteImprovements) {
    lines.push(`- **${item.title}** (${item.priority}) — ${item.reason}`)
  }
  lines.push("")

  lines.push("## 7. HTML FAQ Block")
  lines.push("")
  lines.push("```html")
  lines.push(buildHtmlFaqBlock(report))
  lines.push("```")

  return lines.join("\n")
}
