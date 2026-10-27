import { findAuditById } from "@/modules/audit/audit.repository"

/**
 * @swagger
 * /api/audits/{id}/download.md:
 *   get:
 *     tags:
 *       - Exports
 *     summary: Download full audit report as Markdown
 *     description: Returns the generated Markdown report as a downloadable .md file when the audit status is READY.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique CUID of the audit.
 *     responses:
 *       200:
 *         description: Markdown file attachment.
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 *       404:
 *         description: Audit not found or report is not READY yet.
 */
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