import { prisma } from "@/db/prisma"
import { BusinessType } from "@prisma/client"

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