export const CLARITY_CATEGORIES = [
  {
    key: "TRUST",
    label: "Trust",
    description:
      "Reviews, certifications/licenses, years in business, team/about",
  },
  {
    key: "PRICING",
    label: "Pricing",
    description: "Cost, how pricing works, free estimate/quote",
  },
  {
    key: "PROCESS",
    label: "Process",
    description: "What happens after contact/form submission, work steps",
  },
  {
    key: "SCOPE",
    label: "Scope",
    description: "Exact services, geographic area served, who they serve",
  },
  {
    key: "LOGISTICS",
    label: "Logistics",
    description: "Hours, turnaround/lead time, emergency/urgent availability",
  },
  {
    key: "PAYMENT",
    label: "Payment",
    description: "Payment methods, financing, deposits, cancellation terms",
  },
  {
    key: "RISK",
    label: "Risk",
    description: "Warranty, refund/satisfaction guarantee, insurance/bonded",
  },
  {
    key: "CONVERSION",
    label: "Conversion",
    description: "Clear next step, obvious contact options",
  },
  {
    key: "OBJECTIONS",
    label: "Objections",
    description: "Common visitor doubts left unanswered",
  },
] as const

export const CLARITY_CATEGORY_KEYS = CLARITY_CATEGORIES.map((c) => c.key) as [
  (typeof CLARITY_CATEGORIES)[number]["key"],
  ...(typeof CLARITY_CATEGORIES)[number]["key"][],
]
