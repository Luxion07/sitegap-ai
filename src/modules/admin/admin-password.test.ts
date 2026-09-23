import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { verifyPassword } from "./admin-password"

const ORIGINAL_ENV = { ...process.env }
const REAL_PASSWORD = "correct-horse-battery-staple"

describe("verifyPassword", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.ADMIN_PASSWORD = REAL_PASSWORD
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it("accepts the correct password", () => {
    expect(verifyPassword(REAL_PASSWORD)).toBe(true)
  })

  it("rejects an incorrect password of the same length", () => {
    expect(verifyPassword("correct-horse-battery-stapla")).toBe(false)
  })

  it("rejects an empty password", () => {
    expect(verifyPassword("")).toBe(false)
  })

  it("rejects a password that is a prefix of the real one", () => {
    expect(verifyPassword("correct-horse")).toBe(false)
  })

  it("rejects a password longer than the real one", () => {
    expect(verifyPassword(`${REAL_PASSWORD}-extra`)).toBe(false)
  })

  it("returns false when ADMIN_PASSWORD is not configured", () => {
    delete process.env.ADMIN_PASSWORD

    expect(verifyPassword(REAL_PASSWORD)).toBe(false)
  })
})
