import type { AuditStatus } from "@prisma/client"

// Generation error codes (SPEC §22 — FETCH_TIMEOUT, EXTRACTION_EMPTY,
// LLM_INVALID_JSON, ...) are added in Phase 4-5 together with the pipeline
// that can produce them.
export type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"

export type ApiFieldIssue = {
  field: string
  message: string
}

export type ApiErrorBody = {
  error: ApiErrorCode
  message: string
  issues?: ApiFieldIssue[]
}

export type CreateAuditResponse = {
  auditId: string
  status: AuditStatus
  reportUrl: string
}
