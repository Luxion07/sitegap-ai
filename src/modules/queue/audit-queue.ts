import IORedis from "ioredis"
import { Queue } from "bullmq"

export const AUDIT_QUEUE_NAME = "audit-generation"
let auditQueueInstance: Queue<AuditJobData> | null = null

export interface AuditJobData {
  auditId: string
}

export function createRedisConnection() {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })
}

export function getAuditQueue(): Queue<AuditJobData> {
  if (!auditQueueInstance) {
    auditQueueInstance = new Queue<AuditJobData>(AUDIT_QUEUE_NAME, {
      connection: createRedisConnection(),
    })
  }
  return auditQueueInstance
}

export async function enqueueAuditJob(auditId: string): Promise<void> {
  const queue = getAuditQueue()
  await queue.add(
    "generate-report",
    { auditId },
    {
      jobId: auditId,
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    }
  )
}
