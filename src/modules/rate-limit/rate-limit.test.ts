import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const count = vi.fn()
const create = vi.fn()

vi.mock("@/db/prisma", () => ({
  prisma: {
    rateLimitEvent: {
      count: (...args: unknown[]) => count(...args),
      create: (...args: unknown[]) => create(...args),
    },
  },
}))

const { checkAndRecordAuditRateLimit, RateLimitError } =
  await import("./rate-limit")

const ORIGINAL_ENV = { ...process.env }

function ipHashArgOf(mockCall: unknown[]) {
  return (mockCall[0] as { where: { ipHash: string } }).where.ipHash
}

describe("checkAndRecordAuditRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...ORIGINAL_ENV }
    process.env.RATE_LIMIT_SALT = "test-salt"
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it("records an event when under both limits", async () => {
    count.mockResolvedValue(0)
    create.mockResolvedValue({})

    await checkAndRecordAuditRateLimit("1.2.3.4")

    expect(create).toHaveBeenCalledTimes(1)
  })

  it("throws when the hourly limit is reached, without recording a new event", async () => {
    count.mockResolvedValueOnce(3).mockResolvedValueOnce(0)

    await expect(
      checkAndRecordAuditRateLimit("1.2.3.4")
    ).rejects.toBeInstanceOf(RateLimitError)
    expect(create).not.toHaveBeenCalled()
  })

  it("throws when the daily limit is reached, without recording a new event", async () => {
    count.mockResolvedValueOnce(0).mockResolvedValueOnce(10)

    await expect(
      checkAndRecordAuditRateLimit("1.2.3.4")
    ).rejects.toBeInstanceOf(RateLimitError)
    expect(create).not.toHaveBeenCalled()
  })

  it("hashes the same IP to the same value on every call", async () => {
    count.mockResolvedValue(0)
    create.mockResolvedValue({})

    await checkAndRecordAuditRateLimit("1.2.3.4")
    const firstHash = ipHashArgOf(count.mock.calls[0])

    vi.clearAllMocks()
    count.mockResolvedValue(0)
    create.mockResolvedValue({})

    await checkAndRecordAuditRateLimit("1.2.3.4")
    const secondHash = ipHashArgOf(count.mock.calls[0])

    expect(firstHash).toBe(secondHash)
  })

  it("hashes different IPs to different values", async () => {
    count.mockResolvedValue(0)
    create.mockResolvedValue({})

    await checkAndRecordAuditRateLimit("1.2.3.4")
    const firstIpHash = ipHashArgOf(count.mock.calls[0])

    vi.clearAllMocks()
    count.mockResolvedValue(0)
    create.mockResolvedValue({})

    await checkAndRecordAuditRateLimit("5.6.7.8")
    const secondIpHash = ipHashArgOf(count.mock.calls[0])

    expect(firstIpHash).not.toBe(secondIpHash)
  })

  it("throws when RATE_LIMIT_SALT is missing, before touching the database", async () => {
    delete process.env.RATE_LIMIT_SALT

    await expect(checkAndRecordAuditRateLimit("1.2.3.4")).rejects.toThrow()
    expect(count).not.toHaveBeenCalled()
  })
})
