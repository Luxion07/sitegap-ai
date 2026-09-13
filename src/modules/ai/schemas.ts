import { z } from "zod"

import { CLARITY_CATEGORY_KEYS } from "./clarity-categories"

const priority = z.enum(["HIGH", "MEDIUM", "LOW"])
const categoryStatus = z.enum(["ANSWERED", "PARTIAL", "MISSING"])
const answeredConfidence = z.enum(["FOUND_ON_SITE", "INFERRED_FROM_CONTEXT"])
const faqConfidence = z.enum([
  "FOUND_ON_SITE",
  "INFERRED_FROM_CONTEXT",
  "MISSING_NEEDS_CONFIRMATION",
])

export const reportSchema = z.object({
  analyzedScope: z.object({
    pagesAnalyzed: z.array(z.string()),
    note: z.string(),
  }),
  clarityScore: z.object({
    overall: z.number().min(0).max(100),
    categories: z.array(
      z.object({
        key: z.enum(CLARITY_CATEGORY_KEYS),
        label: z.string(),
        status: categoryStatus,
        priority,
        note: z.string(),
      })
    ),
  }),
  businessSummary: z.object({
    nameGuess: z.string().nullable(),
    whatTheyDo: z.string(),
    targetCustomers: z.string(),
    detectedBusinessType: z.enum(["LOCAL_SERVICE", "B2B_SERVICE", "OTHER"]),
    confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  }),
  detectedOffers: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      evidence: z.string().nullable(),
    })
  ),
  answeredQuestions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      evidence: z.string(),
      confidence: answeredConfidence,
    })
  ),
  missingQuestions: z.array(
    z.object({
      question: z.string(),
      whyItMatters: z.string(),
      priority,
      suggestedWebsiteSection: z.string(),
      suggestedAnswerGuidance: z.string(),
    })
  ),
  readyFaq: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      confidence: faqConfidence,
      needsBusinessConfirmation: z.boolean(),
      sourceNote: z.string(),
    })
  ),
  websiteImprovements: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
      suggestedCopy: z.string(),
      priority,
    })
  ),
})

export type Report = z.infer<typeof reportSchema>
