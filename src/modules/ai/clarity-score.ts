import type { ClarityCategory } from "./schemas"

const STATUS_WEIGHT: Record<ClarityCategory["status"], number> = {
  ANSWERED: 1,
  PARTIAL: 0.5,
  MISSING: 0,
}

// The model judges each category; the overall number is plain arithmetic over
// those judgments, so the same statuses always produce the same score.
export function computeClarityScore(
  categories: Pick<ClarityCategory, "status">[]
): number {
  if (categories.length === 0) return 0

  const total = categories.reduce(
    (sum, category) => sum + STATUS_WEIGHT[category.status],
    0
  )
  return Math.round((total / categories.length) * 100)
}
