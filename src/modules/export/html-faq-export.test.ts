import { describe, expect, it } from "vitest"

import { sampleReport } from "@/modules/ai/sample-report.fixture"

import { buildHtmlFaqBlock } from "./html-faq-export"

describe("buildHtmlFaqBlock", () => {
  it("renders one faq-item per readyFaq entry", () => {
    const html = buildHtmlFaqBlock(sampleReport)

    expect(html).toContain('<section class="faq-section">')
    expect(html).toContain("<h2>Frequently Asked Questions</h2>")
    expect(html).toContain(sampleReport.readyFaq[0].question)
    expect(html).toContain(sampleReport.readyFaq[0].answer)
  })

  it("escapes HTML-significant characters in question/answer text", () => {
    const withMarkup = {
      ...sampleReport,
      readyFaq: [
        {
          ...sampleReport.readyFaq[0],
          question: '<script>alert("x")</script>',
          answer: "Tom & Jerry's <b>bold</b> answer",
        },
      ],
    }

    const html = buildHtmlFaqBlock(withMarkup)

    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;")
    expect(html).toContain("Tom &amp; Jerry's &lt;b&gt;bold&lt;/b&gt; answer")
  })

  it("produces no dynamic script tags regardless of input", () => {
    const html = buildHtmlFaqBlock(sampleReport)

    expect(html).not.toMatch(/<script/i)
  })
})
