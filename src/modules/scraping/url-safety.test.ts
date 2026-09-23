import { describe, expect, it, vi } from "vitest"

const dnsLookup = vi.fn()

vi.mock("node:dns", () => ({
  promises: {
    lookup: (...args: unknown[]) => dnsLookup(...args),
  },
}))

const { assertSafeUrl, UrlSafetyError } = await import("./url-safety")

function mockDns(addresses: string[]) {
  dnsLookup.mockResolvedValue(addresses.map((address) => ({ address })))
}

describe("assertSafeUrl", () => {
  it("accepts a public IPv4 address", async () => {
    mockDns(["93.184.216.34"])

    const result = await assertSafeUrl("https://example.com")

    expect(result.ip).toBe("93.184.216.34")
    expect(result.url.hostname).toBe("example.com")
  })

  it("rejects a malformed URL", async () => {
    await expect(assertSafeUrl("not a url")).rejects.toBeInstanceOf(
      UrlSafetyError
    )
  })

  it("rejects a non-http(s) protocol", async () => {
    await expect(assertSafeUrl("ftp://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("rejects loopback (127.0.0.1)", async () => {
    mockDns(["127.0.0.1"])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("rejects the cloud metadata IP (169.254.169.254)", async () => {
    mockDns(["169.254.169.254"])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("rejects private 10.x", async () => {
    mockDns(["10.0.0.5"])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("rejects private 172.16.0.0/12 and allows just outside its boundary", async () => {
    mockDns(["172.20.5.5"])
    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })

    mockDns(["172.32.0.1"])
    await expect(assertSafeUrl("https://example.com")).resolves.toBeDefined()
  })

  it("rejects private 192.168.x", async () => {
    mockDns(["192.168.1.1"])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("rejects IPv6 loopback (::1)", async () => {
    mockDns(["::1"])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("rejects IPv6 unique-local (fd00::/fc00::)", async () => {
    mockDns(["fd12:3456::1"])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("rejects IPv6 link-local (fe80::)", async () => {
    mockDns(["fe80::1"])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("rejects an IPv4-mapped IPv6 loopback (::ffff:127.0.0.1)", async () => {
    mockDns(["::ffff:127.0.0.1"])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("rejects when any resolved address is blocked, even if another is public", async () => {
    mockDns(["93.184.216.34", "127.0.0.1"])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "BLOCKED_URL",
    })
  })

  it("accepts when every resolved address is public", async () => {
    mockDns(["93.184.216.34", "1.1.1.1"])

    await expect(assertSafeUrl("https://example.com")).resolves.toBeDefined()
  })

  it("rejects when DNS lookup fails", async () => {
    dnsLookup.mockRejectedValue(new Error("ENOTFOUND"))

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "INVALID_URL",
    })
  })

  it("rejects when DNS returns no addresses", async () => {
    dnsLookup.mockResolvedValue([])

    await expect(assertSafeUrl("https://example.com")).rejects.toMatchObject({
      code: "INVALID_URL",
    })
  })
})
