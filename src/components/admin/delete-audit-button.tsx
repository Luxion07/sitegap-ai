"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function DeleteAuditButton({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    const confirmed = window.confirm(
      "Delete this audit permanently? This cannot be undone."
    )
    if (!confirmed) return

    setLoading(true)
    const response = await fetch(`/api/admin/audits/${auditId}/delete`, {
      method: "POST",
    })

    if (!response.ok) {
      setLoading(false)
      window.alert("Failed to delete the audit.")
      return
    }

    router.push("/admin")
  }

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? "Deleting..." : "Delete audit"}
    </Button>
  )
}
