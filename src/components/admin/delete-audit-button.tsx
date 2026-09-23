"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function DeleteAuditButton({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleConfirm() {
    setLoading(true)
    setError("")

    const response = await fetch(`/api/admin/audits/${auditId}/delete`, {
      method: "POST",
    })

    if (!response.ok) {
      setLoading(false)
      setError("Failed to delete the audit.")
      return
    }

    router.push("/admin")
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" />}
      >
        Delete audit
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this audit?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the audit and its report. This cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
