import { timingSafeEqual } from "node:crypto"

export function verifyPassword(password: string): boolean {
  if (!process.env.ADMIN_PASSWORD) return false

  const inputBuf = Buffer.from(password)
  const expectedBuf = Buffer.from(process.env.ADMIN_PASSWORD)

  if (inputBuf.length !== expectedBuf.length) return false

  return timingSafeEqual(inputBuf, expectedBuf)
}
