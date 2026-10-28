import type { Report } from "./schemas"

// Shared fixture for schema and export tests — a minimal but fully valid Report.
export const sampleReport: Report = {
  analyzedScope: {
    pagesAnalyzed: ["https://example.com"],
    note: "Homepage only.",
  },
  clarityScore: {
    // PARTIAL (0.5) + MISSING (0) over 2 categories — matches computeClarityScore.
    overall: 25,
    categories: [
      {
        key: "TRUST",
        label: "Trust",
        status: "PARTIAL",
        priority: "MEDIUM",
        note: "No reviews or certifications mentioned.",
      },
      {
        key: "PRICING",
        label: "Pricing",
        status: "MISSING",
        priority: "HIGH",
        note: "No pricing information found.",
      },
    ],
  },
  businessSummary: {
    nameGuess: "Example Co",
    whatTheyDo: "Provides example services to local customers.",
    targetCustomers: "Homeowners in the local area.",
    detectedBusinessType: "LOCAL_SERVICE",
    confidence: "MEDIUM",
  },
  detectedOffers: [
    {
      title: "Example Service",
      description: "A service offered by the business.",
      evidence: "Mentioned on the homepage.",
    },
  ],
  answeredQuestions: [
    {
      question: "What areas do you serve?",
      answer: "The local metro area.",
      evidence: "Stated in the homepage footer.",
      confidence: "FOUND_ON_SITE",
    },
  ],
  missingQuestions: [
    {
      question: "How much does this cost?",
      whyItMatters: "Visitors want to estimate budget before contacting.",
      priority: "HIGH",
      suggestedWebsiteSection: "Pricing",
      suggestedAnswerGuidance: "Add a starting price or free-estimate note.",
    },
  ],
  readyFaq: [
    {
      question: "Do you offer free estimates?",
      answer: "Not clearly answered on the analyzed page.",
      confidence: "MISSING_NEEDS_CONFIRMATION",
      needsBusinessConfirmation: true,
      sourceNote: "No pricing or estimate information found on the homepage.",
    },
  ],
  websiteImprovements: [
    {
      title: "Add a pricing section",
      reason: "Visitors leave when pricing is unclear.",
      suggestedCopy: "Contact us for a free, no-obligation estimate.",
      priority: "HIGH",
    },
  ],
}
