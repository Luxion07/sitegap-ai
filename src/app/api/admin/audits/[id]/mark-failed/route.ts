import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { verifySessionToken } from "@/modules/admin/admin-session"
import { updateAudit } from "@/modules/audit/audit.repository"

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/audits/[id]/mark-failed">
) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value

  if (!verifySessionToken(token)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { id } = await params

  try {
    await updateAudit(id, {
      status: "FAILED",
      statusMessage: "Manually marked as failed by an admin.",
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
