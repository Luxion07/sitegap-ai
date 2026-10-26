import { Worker } from "bullmq"
import { AUDIT_QUEUE_NAME, type AuditJobData, createRedisConnection } from "@/modules/queue/audit-queue"
import { processAuditJob, markAuditFailed } from "@/modules/audit/audit.service"

const worker = new Worker<AuditJobData>(
    AUDIT_QUEUE_NAME,
    async (job) => {
        console.log(`[worker] Processing audit ${job.data.auditId} (attempt ${job.attemptsMade + 1})`)
        await processAuditJob(job.data.auditId)
    },
    {
        connection: createRedisConnection(),
        concurrency: 2,
    }
)

worker.on("completed", (job) => {
    console.log(`[worker] Completed audit ${job.data.auditId}`)
})

worker.on("failed", async (job, error) => {
    if (!job) {
        console.error("[worker] Job failed without job context:", error)
        return
    }
    const maxAttempts = job.opts.attempts ?? 1
    console.error(
        `[worker] Audit ${job.data.auditId} failed (attempt ${job.attemptsMade}/${maxAttempts}):`,
        error.message
    )
    if (job.attemptsMade >= maxAttempts) {
        try {
            await markAuditFailed(job.data.auditId, error.message)
        } catch (dbError) {
            console.error("[worker] Failed to mark audit as FAILED in DB:", dbError)
        }
    }
})

async function shutdown(signal: string) {
    console.log(`[worker] Received ${signal}, stopping gracefully...`)
    await worker.close()
    process.exit(0)
}

process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))

console.log("[worker] Audit worker started and waiting for jobs...")
