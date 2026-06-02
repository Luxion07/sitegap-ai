import { createAudit } from './audit.repository'
import { CreateAuditInput } from './audit.schemas'

export async function createAuditService(input: CreateAuditInput) {
    const audit = await createAudit({
        websiteUrl: input.websiteUrl,
        businessType: input.businessType,
        manualContext: input.manualContext,
    })

    return audit
}