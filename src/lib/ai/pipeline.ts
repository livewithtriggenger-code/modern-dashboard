import { createClient } from "@supabase/supabase-js";
import { routeAIRequest } from "./router";
import { buildSystemPrompt } from "./prompts";
import { logAIObservation } from "./observability";
import { enqueueOutboundMessage } from "@/lib/queue/service";

export async function processAIGeneration(workspaceId: string, threadId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch Thread, Lead, and Keys
  const [{ data: thread }, { data: keys }] = await Promise.all([
    supabase.from("conversation_threads").select("*, leads(*)").eq("id", threadId).single(),
    supabase.from("workspace_settings").select("*").eq("workspace_id", workspaceId).single()
  ]);

  if (!thread || !keys || thread.status !== "active") return; // Only process if AI is active

  // 2. Fetch Business Knowledge (RAG Pipeline)
  const { data: knowledge } = await supabase
    .from("business_knowledge")
    .select("key, value")
    .eq("workspace_id", workspaceId);

  // 3. Fetch Conversation History (Context Window Management)
  const { data: history } = await supabase
    .from("conversations")
    .select("sender_type, message_body")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(10); // Limit to last 10 messages to optimize token cost

  // @ts-nocheck
  const systemPrompt = await buildSystemPrompt(knowledge || [], thread.leads?.full_name || "Customer");
  
  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []).reverse().map(msg => ({
      role: msg.sender_type === "lead" ? "user" : "assistant",
      content: msg.message_body
    }))
  ];

  // 4. Route AI Request (Cost Optimization Layer -> "small" model for standard chat)
  const response = await routeAIRequest(keys, messages, "small");

  // 5. Observability Logging
  await logAIObservation(workspaceId, threadId, response);

  // 6. Escalation Framework Handling
  if (response.escalate) {
    // Pause the AI autonomously
    await supabase.from("conversation_threads").update({ status: "paused", ai_mode: "handoff" }).eq("id", threadId);
  }

  // 7. Save AI Reply
  const { data: newMsg } = await supabase.from("conversations").insert({
    workspace_id: workspaceId,
    thread_id: threadId,
    sender_type: "ai_agent",
    message_body: response.content,
    channel: "telegram"
  }).select().single();

  if (newMsg) {
    // 8. Update thread last activity
    await supabase.from("conversation_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
    
    // 9. Dispatch to Outbound Queue (Telegram)
    await enqueueOutboundMessage(workspaceId, newMsg.id);
    
    // 10. Extract AI Memories and Lead Intelligence asynchronously
    const { extractAIMemories } = await import("./memory_extraction");
    extractAIMemories(workspaceId, threadId).catch(console.error);

    const { generateLeadIntelligence } = await import("./intelligence_generation");
    generateLeadIntelligence(workspaceId, thread.lead_id).catch(console.error);
  }
}
