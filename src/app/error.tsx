"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="mb-2.5 text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mb-8 max-w-[420px] text-[15px] text-muted-foreground">
          An unexpected error occurred. You can try again, or head back to the
          homepage.
        </p>
        <Button type="button" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </main>
    </div>
  )
}
