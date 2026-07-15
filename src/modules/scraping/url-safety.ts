import { promises as dns } from "node:dns"
import net from "node:net"

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])

const BLOCKED_IPV4_RANGES: Array<{ base: string; bits: number }> = [
  { base: "0.0.0.0", bits: 8 }, // "this network"
  { base: "10.0.0.0", bits: 8 }, // private
  { base: "127.0.0.0", bits: 8 }, // loopback
  { base: "169.254.0.0", bits: 16 }, // link-local, incl. cloud metadata (169.254.169.254)
  { base: "172.16.0.0", bits: 12 }, // private
  { base: "192.168.0.0", bits: 16 }, // private
]

const BLOCKED_IPV6_PREFIXES = ["::1", "fe80:", "fc00:", "fd00:"]

function ipv4ToInt(ip: string): number {
  return (
    ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0
  )
}

function isBlockedIpv4(ip: string): boolean {
  const ipInt = ipv4ToInt(ip)
  return BLOCKED_IPV4_RANGES.some(({ base, bits }) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
    return (ipInt & mask) === (ipv4ToInt(base) & mask)
  })
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  // ::ffff:127.0.0.1 is an IPv4 address smuggled in IPv6 syntax — unwrap and recheck.
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mappedIpv4) return isBlockedIpv4(mappedIpv4[1])
  return BLOCKED_IPV6_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

function isBlockedIp(ip: string): boolean {
  return net.isIP(ip) === 6 ? isBlockedIpv6(ip) : isBlockedIpv4(ip)
}

export class UrlSafetyError extends Error {
  code: "INVALID_URL" | "BLOCKED_URL"

  constructor(code: "INVALID_URL" | "BLOCKED_URL", message: string) {
    super(message)
    this.name = "UrlSafetyError"
    this.code = code
  }
}

export async function assertSafeUrl(
  rawUrl: string
): Promise<{ url: URL; ip: string }> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new UrlSafetyError("INVALID_URL", "Please enter a valid website URL.")
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new UrlSafetyError(
      "BLOCKED_URL",
      "This URL cannot be analyzed for security reasons."
    )
  }

  let addresses: { address: string }[]
  try {
    addresses = await dns.lookup(url.hostname, { all: true })
  } catch {
    throw new UrlSafetyError("INVALID_URL", "Please enter a valid website URL.")
  }

  if (addresses.length === 0) {
    throw new UrlSafetyError("INVALID_URL", "Please enter a valid website URL.")
  }

  if (addresses.some((entry) => isBlockedIp(entry.address))) {
    throw new UrlSafetyError(
      "BLOCKED_URL",
      "This URL cannot be analyzed for security reasons."
    )
  }

  return { url, ip: addresses[0].address }
}
