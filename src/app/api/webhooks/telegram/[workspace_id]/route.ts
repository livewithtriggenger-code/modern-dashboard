import { NextRequest, NextResponse } from "next/server";
import { enqueueJob } from "@/lib/queue/service";
import { waitUntil } from "@vercel/functions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ workspace_id: string }> }) {
  const { workspace_id } = await params;
  const payload = await req.json();

  // Enqueue job to Redis explicitly
  await enqueueJob("telegram_inbound", "inbound_webhook", { workspaceId: workspace_id, payload });

  // In a truly decoupled serverless architecture like AWS or Vercel, 
  // you would use Upstash QStash to ping a separate Worker endpoint.
  // For Vercel Edge specifically, we can use waitUntil to trigger our worker non-blocking.
  // This calls our secure worker endpoint to pop from the queue and process it asynchronously.
  const workerUrl = new URL('/api/worker/process', req.url);
  waitUntil(fetch(workerUrl.toString(), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev_secret'}` },
    body: JSON.stringify({ queues: ["telegram_inbound", "telegram_outbound"] })
  }).catch(e => console.error("Worker trigger failed", e)));

  // Return 200 OK immediately as required by Telegram APIs
  return NextResponse.json({ ok: true });
}
