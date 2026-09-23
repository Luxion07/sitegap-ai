import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { verifyPassword } from "@/modules/admin/admin-password"
import {
  createSessionToken,
  SESSION_DURATION_MS,
} from "@/modules/admin/admin-session"
import { loginSchema } from "@/modules/admin/admin.schemas"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Request body must be valid JSON.",
      },
      { status: 400 }
    )
  }

  const result = loginSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!verifyPassword(result.data.password)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    const token = createSessionToken()
    const cookieStore = await cookies()
    cookieStore.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
