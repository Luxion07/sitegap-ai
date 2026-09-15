import { findAuditById } from "@/modules/audit/audit.repository"

export async function GET(
    request: Request,
    { params }: RouteContext<'/api/audits/[id]/download.md'>
) {
    const { id } = await params
    const audit = await findAuditById(id)

    if (!audit || !audit.markdownReport) {
        return new Response(null, { status: 404 })
    }

    return new Response(audit.markdownReport, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="sitegap-audit-${id}.md"`,
        },
    })
}