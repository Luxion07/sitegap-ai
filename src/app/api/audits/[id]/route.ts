import { NextResponse } from "next/server"

import { findAuditById } from "@/modules/audit/audit.repository"
import type { ApiErrorBody } from "@/modules/audit/audit.types"

/**
 * @swagger
 * /api/audits/{id}:
 *   get:
 *     tags:
 *       - Audits
 *     summary: Get audit processing status
 *     description: Polled by the /audit/[id] report page every 2 seconds while status is PROCESSING.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique CUID of the audit.
 *     responses:
 *       200:
 *         description: Current audit status.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditStatusResponse'
 *       404:
 *         description: Audit not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorBody'
 */
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
