import { prisma } from "@/db/prisma"
import { AuditStatus, BusinessType } from "@prisma/client"

export async function createAudit(data: {
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
  }
) {
  return prisma.audit.update({ where: { id }, data })
}
