import { describe, expect, it } from "vitest"

import { computeClarityScore } from "./clarity-score"

describe("computeClarityScore", () => {
  it("returns 100 when every category is answered", () => {
    const score = computeClarityScore([
      { status: "ANSWERED" },
      { status: "ANSWERED" },
    ])

    expect(score).toBe(100)
  })

  it("returns 0 when every category is missing", () => {
    const score = computeClarityScore([
      { status: "MISSING" },
      { status: "MISSING" },
    ])

    expect(score).toBe(0)
  })

  it("counts a partial answer as half", () => {
    const score = computeClarityScore([
      { status: "ANSWERED" },
      { status: "PARTIAL" },
      { status: "MISSING" },
      { status: "MISSING" },
    ])

    expect(score).toBe(38) // (1 + 0.5) / 4 = 37.5, rounded
  })

  it("returns 0 for an empty category list instead of NaN", () => {
    expect(computeClarityScore([])).toBe(0)
  })
})
