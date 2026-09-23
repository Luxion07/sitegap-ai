import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createSessionToken,
  SESSION_DURATION_MS,
  verifySessionToken,
} from "./admin-session"

const ORIGINAL_ENV = { ...process.env }

describe("createSessionToken", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.ADMIN_SESSION_SECRET = "test-secret"
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.useRealTimers()
  })

  it("returns a payload.signature shaped token", () => {
    const token = createSessionToken()

    expect(token).toMatch(/^\d+\.[0-9a-f]{64}$/)
  })

  it("throws when ADMIN_SESSION_SECRET is not set", () => {
    delete process.env.ADMIN_SESSION_SECRET

    expect(() => createSessionToken()).toThrow()
  })
})

describe("verifySessionToken", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.ADMIN_SESSION_SECRET = "test-secret"
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.useRealTimers()
  })

  it("accepts a freshly created token", () => {
    const token = createSessionToken()

    expect(verifySessionToken(token)).toBe(true)
  })

  it("rejects a missing token", () => {
    expect(verifySessionToken(undefined)).toBe(false)
  })

  it("rejects garbage input with no signature part", () => {
    expect(verifySessionToken("not-a-real-token")).toBe(false)
  })

  it("rejects a token with a tampered signature", () => {
    const token = createSessionToken()
    const [payload, signature] = token.split(".")
    const flippedChar = signature[0] === "a" ? "b" : "a"
    const tampered = `${payload}.${flippedChar}${signature.slice(1)}`

    expect(verifySessionToken(tampered)).toBe(false)
  })

  it("rejects a token whose payload was changed to extend expiry", () => {
    const token = createSessionToken()
    const [payload, signature] = token.split(".")
    const bumpedPayload = String(Number(payload) + 1)

    expect(verifySessionToken(`${bumpedPayload}.${signature}`)).toBe(false)
  })

  it("rejects an expired token", () => {
    const now = Date.now()
    const token = createSessionToken()

    vi.useFakeTimers()
    vi.setSystemTime(now + SESSION_DURATION_MS + 1000)

    expect(verifySessionToken(token)).toBe(false)
  })

  it("rejects when ADMIN_SESSION_SECRET is missing at verify time", () => {
    const token = createSessionToken()
    delete process.env.ADMIN_SESSION_SECRET

    expect(verifySessionToken(token)).toBe(false)
  })
})
