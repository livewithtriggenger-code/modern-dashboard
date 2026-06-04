import { NextRequest, NextResponse } from "next/server";
import { dequeueJob, completeJob, failJob } from "@/lib/queue/service";
import { processInboundWebhookPayload } from "@/lib/queue/inbound_processor";
import { processOutboundJobPayload } from "@/lib/queue/outbound_processor";

export async function POST(req: NextRequest) {
  // Enforce security so only authorized chron/webhook invokes this worker
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET || 'dev_secret'}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { queues } = await req.json().catch(() => ({ queues: [] }));
  if (!Array.isArray(queues) || queues.length === 0) {
    return NextResponse.json({ error: "No queues specified" }, { status: 400 });
  }

  let processedCount = 0;

  for (const queue of queues) {
    // Process up to 5 jobs per queue per invocation to prevent Edge timeout
    for (let i = 0; i < 5; i++) {
      const job = await dequeueJob(queue);
      if (!job) break; // queue empty

      try {
        if (job.type === "inbound_webhook") {
          await processInboundWebhookPayload(job.payload.workspaceId, job.payload.payload);
        } else if (job.type === "send_message") {
          await processOutboundJobPayload(job.payload.workspaceId, job.payload.messageId);
        } else {
          console.warn(`[Worker] Unknown job type: ${job.type}`);
        }

        await completeJob(queue, job);
        processedCount++;
      } catch (error: any) {
        console.error(`[Worker] Job ${job.id} failed:`, error.message);
        await failJob(queue, job, error.message);
      }
    }
  }

  return NextResponse.json({ ok: true, processedCount });
}
