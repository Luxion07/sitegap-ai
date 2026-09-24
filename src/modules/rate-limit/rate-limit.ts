import { createHash } from "node:crypto"

import { prisma } from "@/db/prisma"

// SPEC §15.2 — MVP rate limits.
const MAX_PER_HOUR = 3
const MAX_PER_DAY = 10
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

const CREATE_AUDIT_ACTION = "create_audit"

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RateLimitError"
  }
}

// The raw IP never touches the database — only a salted hash of it. Without
// the salt, storing a bare SHA-256 of the IP would still let anyone with DB
// access map hashes back to real IPs via a rainbow table (IPv4 space is
// small enough to brute-force).
function hashIp(ip: string): string {
  if (!process.env.RATE_LIMIT_SALT) {
    throw new Error("RATE_LIMIT_SALT is not set")
  }
  return createHash("sha256")
    .update(ip + process.env.RATE_LIMIT_SALT)
    .digest("hex")
}

export async function checkAndRecordAuditRateLimit(ip: string) {
  const ipHash = hashIp(ip)
  const now = new Date()

  const [hourCount, dayCount] = await Promise.all([
    prisma.rateLimitEvent.count({
      where: {
        ipHash,
        action: CREATE_AUDIT_ACTION,
        createdAt: { gte: new Date(now.getTime() - HOUR_MS) },
      },
    }),
    prisma.rateLimitEvent.count({
      where: {
        ipHash,
        action: CREATE_AUDIT_ACTION,
        createdAt: { gte: new Date(now.getTime() - DAY_MS) },
      },
    }),
  ])

  if (hourCount >= MAX_PER_HOUR) {
    throw new RateLimitError(
      "Too many audits from this network in the last hour. Please try again later."
    )
  }

  if (dayCount >= MAX_PER_DAY) {
    throw new RateLimitError(
      "Daily audit limit reached for this network. Please try again tomorrow."
    )
  }

  await prisma.rateLimitEvent.create({
    data: { ipHash, action: CREATE_AUDIT_ACTION },
  })
}
