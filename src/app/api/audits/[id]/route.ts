import { NextResponse } from "next/server"

import { findAuditById } from "@/modules/audit/audit.repository"
import type { ApiErrorBody } from "@/modules/audit/audit.types"

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/audits/[id]">
) {
  const { id } = await params
  const audit = await findAuditById(id)

  if (!audit) {
    return NextResponse.json<ApiErrorBody>(
      {
        error: "NOT_FOUND",
        message: "Audit not found.",
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    id: audit.id,
    status: audit.status,
    statusMessage: audit.statusMessage,
  })
}
