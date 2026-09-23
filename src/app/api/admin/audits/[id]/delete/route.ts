import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { verifySessionToken } from "@/modules/admin/admin-session"
import { deleteAudit } from "@/modules/audit/audit.repository"

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/audits/[id]/delete">
) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value

  if (!verifySessionToken(token)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { id } = await params

  try {
    await deleteAudit(id)
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
