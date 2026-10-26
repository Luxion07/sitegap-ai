import { prisma } from "@/db/prisma"
import { AuditStatus, BusinessType, Prisma } from "@prisma/client"

export async function createAudit(data: {
  status?: AuditStatus
  websiteUrl: string
  businessType: BusinessType
  manualContext?: string
}) {
  return prisma.audit.create({ data })
}

export async function findAuditById(id: string) {
  return prisma.audit.findUnique({ where: { id } })
}

export async function updateAudit(
  id: string,
  data: {
    status?: AuditStatus
    statusMessage?: string | null
    sourceText?: string | null
    reportJson?: Prisma.InputJsonValue
    previewJson?: Prisma.InputJsonValue
    markdownReport?: string | null
    htmlFaqBlock?: string | null
  }
) {
  return prisma.audit.update({ where: { id }, data })
}

export async function findAllAudits(status?: AuditStatus) {
  return prisma.audit.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  })
}

export async function deleteAudit(id: string) {
  return prisma.audit.delete({ where: { id } })
}
