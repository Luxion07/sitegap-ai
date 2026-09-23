import { describe, expect, it } from "vitest"

import { loginSchema } from "./admin.schemas"

describe("loginSchema", () => {
  it("accepts a non-empty password", () => {
    const result = loginSchema.safeParse({ password: "correct-horse" })

    expect(result.success).toBe(true)
  })

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ password: "" })

    expect(result.success).toBe(false)
  })

  it("rejects a missing password field", () => {
    const result = loginSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it("rejects a non-string password", () => {
    const result = loginSchema.safeParse({ password: 123 })

    expect(result.success).toBe(false)
  })
})
