import { redis } from "./redis";
import { v4 as uuidv4 } from "uuid";

export interface QueueJob {
  id: string;
  type: string;
  payload: any;
  attempts: number;
  maxAttempts: number;
  timestamp: string;
}

export async function enqueueJob(queueName: string, type: string, payload: any, maxAttempts = 3) {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn("[Queue] UPSTASH_REDIS_REST_URL missing. Queue operations bypassed.");
    return;
  }

  const job: QueueJob = {
    id: uuidv4(),
    type,
    payload,
    attempts: 0,
    maxAttempts,
    timestamp: new Date().toISOString()
  };

  await redis.lpush(queueName, JSON.stringify(job));
  console.log(`[Queue] Job enqueued to ${queueName}:`, job.id);
}

export async function dequeueJob(queueName: string): Promise<QueueJob | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  
  // Use RPOPLPUSH for atomicity to a processing queue (to prevent loss if worker crashes)
  const processingQueue = `${queueName}:processing`;
  const rawJob = await redis.rpoplpush(queueName, processingQueue);
  
  if (!rawJob) return null;
  return typeof rawJob === "string" ? JSON.parse(rawJob) : rawJob;
}

export async function completeJob(queueName: string, job: QueueJob) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  const processingQueue = `${queueName}:processing`;
  // LREM removes the specific job string from the processing list
  await redis.lrem(processingQueue, 1, JSON.stringify(job));
}

export async function failJob(queueName: string, job: QueueJob, errorStr: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  const processingQueue = `${queueName}:processing`;
  
  // Remove from processing queue
  await redis.lrem(processingQueue, 1, JSON.stringify(job));

  job.attempts += 1;
  
  if (job.attempts >= job.maxAttempts) {
    // Move to DLQ
    await redis.lpush("dlq", JSON.stringify({ ...job, error: errorStr, failedAt: new Date().toISOString() }));
    console.error(`[Queue] Job ${job.id} moved to DLQ after ${job.attempts} attempts.`);
  } else {
    // Requeue for retry
    await redis.lpush(queueName, JSON.stringify(job));
    console.log(`[Queue] Job ${job.id} requeued for attempt ${job.attempts + 1}`);
  }
}

// Kept for backwards compatibility with conversations.ts, but routes through new redis queue
export async function enqueueOutboundMessage(workspaceId: string, messageId: string) {
  await enqueueJob("telegram_outbound", "send_message", { workspaceId, messageId });
}
