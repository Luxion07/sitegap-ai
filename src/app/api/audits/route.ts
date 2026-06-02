import { createAuditSchema } from "@/modules/audit/audit.schemas"
import { createAuditService } from "@/modules/audit/audit.service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = createAuditSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "INVALID_INPUT", issues: parsed.error.issues },
            { status: 400 }
        )
    }
    const audit = await createAuditService(parsed.data)
    return NextResponse.json(
        { auditId: audit.id, status: audit.status },
        { status: 201 }
    )
}