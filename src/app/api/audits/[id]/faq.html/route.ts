import { findAuditById } from "@/modules/audit/audit.repository"

export async function GET(
    request: Request,
    { params }: RouteContext<'/api/audits/[id]/faq.html'>
) {
    const { id } = await params
    const audit = await findAuditById(id)

    if (!audit || !audit.htmlFaqBlock) {
        return new Response(null, { status: 404 })
    }

    return new Response(audit.htmlFaqBlock, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `attachment; filename="sitegap-audit-${id}-faq.html"`,
        },
    })
}