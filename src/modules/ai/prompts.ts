import { BUSINESS_TYPE_LABELS } from "@/modules/audit/business-type-labels"
import type { BusinessType } from "@prisma/client"

import { CLARITY_CATEGORIES } from "./clarity-categories"

const JSON_SHAPE_TEMPLATE = `{
  "analyzedScope": { "pagesAnalyzed": ["string"], "note": "string" },
  "clarityScore": {
    "categories": [
      {
        "key": "TRUST | PRICING | PROCESS | SCOPE | LOGISTICS | PAYMENT | RISK | CONVERSION | OBJECTIONS",
        "label": "string",
        "status": "ANSWERED | PARTIAL | MISSING",
        "priority": "HIGH | MEDIUM | LOW",
        "note": "string"
      }
    ]
  },
  "businessSummary": {
    "nameGuess": "string or null",
    "whatTheyDo": "string",
    "targetCustomers": "string",
    "detectedBusinessType": "LOCAL_SERVICE | B2B_SERVICE | OTHER",
    "confidence": "LOW | MEDIUM | HIGH"
  },
  "detectedOffers": [
    { "title": "string", "description": "string", "evidence": "string or null" }
  ],
  "answeredQuestions": [
    {
      "question": "string",
      "answer": "string",
      "evidence": "string",
      "confidence": "FOUND_ON_SITE | INFERRED_FROM_CONTEXT"
    }
  ],
  "missingQuestions": [
    {
      "question": "string",
      "whyItMatters": "string",
      "priority": "HIGH | MEDIUM | LOW",
      "suggestedWebsiteSection": "string",
      "suggestedAnswerGuidance": "string"
    }
  ],
  "readyFaq": [
    {
      "question": "string",
      "answer": "string",
      "confidence": "FOUND_ON_SITE | INFERRED_FROM_CONTEXT | MISSING_NEEDS_CONFIRMATION",
      "needsBusinessConfirmation": true,
      "sourceNote": "string"
    }
  ],
  "websiteImprovements": [
    {
      "title": "string",
      "reason": "string",
      "suggestedCopy": "string",
      "priority": "HIGH | MEDIUM | LOW"
    }
  ]
}`

export const SYSTEM_PROMPT = `You are an expert website content clarity auditor and FAQ copywriter for service websites.

Your job is to analyze website text and optional context, then produce a practical FAQ and information-gap audit.

Rules:
- Do not invent business-specific facts.
- If a fact is not present, mark it as missing or needing confirmation.
- Separate facts found on the analyzed page(s) from suggestions.
- Only judge what was provided. Never claim a fact is absent from the whole website.
- Say it is "not clearly answered on the analyzed page(s)".
- Score the page against the provided clarity categories.
- Do not invent your own categories.
- Write in clear, practical English.
- Avoid hype and generic filler.
- Focus on questions real visitors would ask before contacting or buying.
- Return strict valid JSON only.`

export function buildUserPrompt(input: {
  websiteUrl: string
  businessType: BusinessType
  manualContext?: string
  extractedText: string
  tips?: string[]
}): string {
  const clarityCategories = CLARITY_CATEGORIES.map(
    (category) => `${category.key} — ${category.description}`
  ).join("\n")

  const tipsSection =
    input.tips && input.tips.length > 0
      ? `\n\nReference industry tips (what visitors typically look for in this business type — use ONLY as guidance on what gaps to check for; never assume the website has these features unless explicitly stated):\n${input.tips.join("\n\n")}`
      : ""

  return `Analyze the following website content.

Business type selected by user:
${BUSINESS_TYPE_LABELS[input.businessType]}

Website URL:
${input.websiteUrl}

Scope analyzed:
Homepage only.

Clarity categories to score:
${clarityCategories}

Optional manual context:
${input.manualContext ?? "(none provided)"}${tipsSection}

Extracted website text:
${input.extractedText}

Create a Website FAQ & Content Gap Audit report.

Return JSON matching EXACTLY this shape. Every field shown below is required on
every array item — never omit a field or leave one out on any entry:

${JSON_SHAPE_TEMPLATE}

clarityScore.categories must include exactly one entry for each of the 9 categories
listed above — no more, no fewer.`
}
