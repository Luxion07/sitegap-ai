import { NextResponse } from "next/server"

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check
 *     description: Returns 200 OK when the Next.js server is healthy.
 *     responses:
 *       200:
 *         description: Service is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
export async function GET() {
  return NextResponse.json({ status: "ok" })
}
