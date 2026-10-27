import { findAuditById } from "@/modules/audit/audit.repository"

/**
 * @swagger
 * /api/audits/{id}/faq.html:
 *   get:
 *     tags:
 *       - Exports
 *     summary: Download ready-to-use FAQ HTML block
 *     description: Returns a clean, self-contained HTML FAQ section snippet ready to paste into a CMS or landing page.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique CUID of the audit.
 *     responses:
 *       200:
 *         description: HTML FAQ block attachment.
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Audit not found or report is not READY yet.
 */
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