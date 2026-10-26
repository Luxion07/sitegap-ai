"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const POLL_INTERVAL_MS = 2000

export function AuditStatusPoller({ auditId }: { auditId: string }) {
  const router = useRouter()

  useEffect(() => {
    let active = true

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/audits/${auditId}`, {
          cache: "no-store",
        })
        if (!res.ok || !active) return

        const data = (await res.json()) as { status?: string }
        if (data.status && data.status !== "PROCESSING") {
          clearInterval(timer)
          router.refresh()
        }
      } catch {
        // Ignore transient network errors during polling; next tick will retry.
      }
    }, POLL_INTERVAL_MS)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [auditId, router])

  return null
}
