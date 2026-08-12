import { createAuditSchema } from "@/modules/audit/audit.schemas"
import { createAuditService } from "@/modules/audit/audit.service"
import type {
    ApiErrorBody,
    CreateAuditResponse,
} from "@/modules/audit/audit.types"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json<ApiErrorBody>(
            {
                error: "INVALID_JSON",
                message: "Request body must be valid JSON.",
            },
            { status: 400 }
        )
    }

    const parsed = createAuditSchema.safeParse(body)
    if (!parsed.success) {
        // Zod issues are mapped to our own shape so the library's format
        // never becomes part of the public API contract.
        return NextResponse.json<ApiErrorBody>(
            {
                error: "INVALID_INPUT",
                message: "Please check the submitted values.",
                issues: parsed.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            },
            { status: 400 }
        )
    }
    try {
        const audit = await createAuditService(parsed.data)
        return NextResponse.json<CreateAuditResponse>(
            {
                auditId: audit.id,
                status: audit.status,
                reportUrl: `/audit/${audit.id}`,
            },
            { status: 201 }
        )
    } catch (error) {
        // Detail stays in the server log; the client gets an opaque message.
        console.error("[POST /api/audits] failed to create audit", error)
        return NextResponse.json<ApiErrorBody>(
            {
                error: "INTERNAL_ERROR",
                message: "Something went wrong. Please try again.",
            },
            { status: 500 }
        )
    }
}