import type { Report } from "@/modules/ai/schemas"

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildHtmlFaqBlock(report: Report): string {
  const items = report.readyFaq
    .map(
      (item) => `  <div class="faq-item">
    <h3>${escapeHtml(item.question)}</h3>
    <p>${escapeHtml(item.answer)}</p>
  </div>`
    )
    .join("\n")

  return `<section class="faq-section">
  <h2>Frequently Asked Questions</h2>
${items}
</section>`
}
