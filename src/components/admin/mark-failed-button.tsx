"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function MarkFailedButton({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    const confirmed = window.confirm("Mark this audit as failed?")
    if (!confirmed) return

    setLoading(true)
    const response = await fetch(`/api/admin/audits/${auditId}/mark-failed`, {
      method: "POST",
    })

    if (!response.ok) {
      setLoading(false)
      window.alert("Failed to update the audit.")
      return
    }

    router.refresh()
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? "Updating..." : "Mark as failed"}
    </Button>
  )
}
