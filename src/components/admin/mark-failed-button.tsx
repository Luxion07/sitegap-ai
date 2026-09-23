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

export function MarkFailedButton({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleConfirm() {
    setLoading(true)
    setError("")

    const response = await fetch(`/api/admin/audits/${auditId}/mark-failed`, {
      method: "POST",
    })

    if (!response.ok) {
      setLoading(false)
      setError("Failed to update the audit.")
      return
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" variant="outline" />}>
        Mark as failed
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark this audit as failed?</AlertDialogTitle>
          <AlertDialogDescription>
            The status changes to FAILED and shows an admin-set error message.
            This does not delete any data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "Updating..." : "Mark as failed"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
