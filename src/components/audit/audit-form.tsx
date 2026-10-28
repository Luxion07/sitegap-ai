"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { createAuditSchema } from "@/modules/audit/audit.schemas"
import type { ApiErrorBody } from "@/modules/audit/audit.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const BUSINESS_TYPE_OPTIONS = [
  { value: "LOCAL_SERVICE", label: "Local Service" },
  { value: "B2B_SERVICE", label: "B2B Service" },
  { value: "AGENCY_CONSULTING", label: "Agency & Consulting" },
  { value: "OTHER_SERVICE", label: "Other" },
] as const

const MAX_MANUAL_CONTEXT_LENGTH = 5000

export function AuditForm({
  initialUrl = "",
  initialBusinessType = "",
}: {
  initialUrl?: string
  initialBusinessType?: string
}) {
  const router = useRouter()

  const [url, setUrl] = useState(initialUrl)
  const [businessType, setBusinessType] = useState(initialBusinessType)
  const [manualContext, setManualContext] = useState("")
  const [urlError, setUrlError] = useState("")
  const [typeError, setTypeError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError("")

    const result = createAuditSchema.safeParse({
      websiteUrl: url,
      businessType,
      manualContext: manualContext || undefined,
    })

    if (!result.success) {
      let nextUrlError = ""
      let nextTypeError = ""
      for (const issue of result.error.issues) {
        if (issue.path[0] === "websiteUrl") nextUrlError = issue.message
        if (issue.path[0] === "businessType") nextTypeError = issue.message
      }
      setUrlError(nextUrlError)
      setTypeError(nextTypeError)
      return
    }

    setUrlError("")
    setTypeError("")
    setLoading(true)

    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })

      if (!response.ok) {
        if (response.status === 429) {
          const errorBody: ApiErrorBody = await response.json()
          setSubmitError(errorBody.message)
        } else {
          setSubmitError("Something went wrong. Please try again.")
        }
        setLoading(false)
        return
      }

      const { auditId } = await response.json()
      router.push(`/audit/${auditId}`)
    } catch {
      setSubmitError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[560px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
      >
        <div className="mb-5">
          <Label
            htmlFor="websiteUrl"
            className="mb-2 block text-[13px] font-semibold"
          >
            Website URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="websiteUrl"
            placeholder="https://example.com"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value)
              setUrlError("")
            }}
            aria-invalid={Boolean(urlError)}
          />
          {urlError && (
            <p className="mt-1.5 text-[12.5px] text-destructive">{urlError}</p>
          )}
        </div>

        <div className="mb-5">
          <Label className="mb-2 block text-[13px] font-semibold">
            Business type <span className="text-destructive">*</span>
          </Label>
          {/* items lets the trigger show the label for a pre-filled value
              before the popup has ever been opened. */}
          <Select
            items={BUSINESS_TYPE_OPTIONS}
            value={businessType}
            onValueChange={(value) => {
              setBusinessType(value ?? "")
              setTypeError("")
            }}
          >
            <SelectTrigger
              className={cn("w-full", typeError && "border-destructive")}
              aria-invalid={Boolean(typeError)}
            >
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {typeError && (
            <p className="mt-1.5 text-[12.5px] text-destructive">{typeError}</p>
          )}
        </div>

        <div className="mb-6">
          <Label
            htmlFor="manualContext"
            className="mb-2 block text-[13px] font-semibold"
          >
            Tell us about your business{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="manualContext"
            rows={4}
            maxLength={MAX_MANUAL_CONTEXT_LENGTH}
            placeholder="e.g. We help SaaS startups grow through SEO and content marketing..."
            value={manualContext}
            onChange={(event) => setManualContext(event.target.value)}
          />
          <div className="mt-1.5 text-right text-[11.5px] text-muted-foreground">
            {manualContext.length}/{MAX_MANUAL_CONTEXT_LENGTH}
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && (
            <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
          )}
          {loading ? "Analyzing..." : "Analyze my site"}
        </Button>

        {submitError && (
          <p className="mt-3 text-center text-[12.5px] text-destructive">
            {submitError}
          </p>
        )}
      </form>
      <p className="mt-4 text-center text-[12.5px] text-muted-foreground">
        No signup required · Takes about 30 seconds
      </p>
    </div>
  )
}
