import { createHmac, timingSafeEqual } from "node:crypto"

export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000

export function createSessionToken() {
  if (!process.env.ADMIN_SESSION_SECRET) {
    throw new Error("ADMIN_SESSION_SECRET is not set")
  }

  const expiresAt = Date.now() + SESSION_DURATION_MS
  const payload = String(expiresAt)

  const signature = createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex")

  return `${payload}.${signature}`
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false

  const parts = token.split(".")
  if (parts.length !== 2) return false
  const [payload, signature] = parts

  if (!process.env.ADMIN_SESSION_SECRET) return false

  const expectedSignature = createHmac(
    "sha256",
    process.env.ADMIN_SESSION_SECRET
  )
    .update(payload)
    .digest("hex")

  const signatureBuf = Buffer.from(signature)
  const expectedSignatureBuf = Buffer.from(expectedSignature)

  if (signatureBuf.length !== expectedSignatureBuf.length) return false

  const succesToken = timingSafeEqual(signatureBuf, expectedSignatureBuf)

  if (!succesToken) return false

  const expiresAt = Number(payload)
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) return false

  return true
}
