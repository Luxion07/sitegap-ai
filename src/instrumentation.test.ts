import { afterEach, describe, expect, it } from "vitest"

import { register } from "./instrumentation"

const ORIGINAL_ENV = { ...process.env }

const ALL_REQUIRED: Record<string, string> = {
  DATABASE_URL: "postgresql://user:pass@host:5432/db",
  DIRECT_URL: "postgresql://user:pass@host:5432/db",
  LLM_PROVIDER: "gemini",
  LLM_API_KEY: "test-key",
  LLM_MODEL: "gemini-3.6-flash",
  ADMIN_PASSWORD: "test-password",
  ADMIN_SESSION_SECRET: "test-secret",
  RATE_LIMIT_SALT: "test-salt",
  NEXT_PUBLIC_APP_URL: "https://example.com",
}

describe("register", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it("does nothing outside production, even with vars missing", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "development" }
    delete process.env.LLM_API_KEY

    expect(() => register()).not.toThrow()
  })

  it("passes in production when every required variable is set", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production", ...ALL_REQUIRED }

    expect(() => register()).not.toThrow()
  })

  it("throws in production and names every missing variable", () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production", ...ALL_REQUIRED }
    delete process.env.LLM_API_KEY
    delete process.env.RATE_LIMIT_SALT

    let message = ""
    try {
      register()
    } catch (error) {
      message = error instanceof Error ? error.message : ""
    }

    expect(message).toContain("LLM_API_KEY")
    expect(message).toContain("RATE_LIMIT_SALT")
  })
})
