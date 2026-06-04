import { createClient } from "@supabase/supabase-js";

export async function processInboundWebhookPayload(workspaceId: string, payload: any) {
  if (!payload.message || !payload.message.text) return; // Ignore edits/system messages for now

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const telegramChatId = payload.message.chat.id.toString();
  const text = payload.message.text;
  const telegramMessageId = payload.message.message_id.toString();

  let { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("telegram_chat_id", telegramChatId)
    .single();

  if (!lead) {
    const fullName = payload.message.from.first_name + (payload.message.from.last_name ? " " + payload.message.from.last_name : "");
    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({
        workspace_id: workspaceId,
        full_name: fullName,
        telegram_chat_id: telegramChatId,
        source: "Telegram",
        status: "new",
        intent: "low",
        urgency: "low",
        lead_score: 0,
      })
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    lead = newLead;
    
    if (lead) {
      await supabase.from("lead_intelligence").insert({
        lead_id: lead.id,
        workspace_id: workspaceId,
        priority: "medium",
      });
    }
  }

  if (!lead) return;

  let { data: thread } = await supabase
    .from("conversation_threads")
    .select("id, status")
    .eq("workspace_id", workspaceId)
    .eq("lead_id", lead.id)
    .neq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!thread) {
    const { data: newThread, error } = await supabase
      .from("conversation_threads")
      .insert({
        workspace_id: workspaceId,
        lead_id: lead.id,
        status: "active",
      })
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    thread = newThread;
  }

  if (!thread) return;

  const { error: msgError } = await supabase
    .from("conversations")
    .insert({
      workspace_id: workspaceId,
      thread_id: thread.id,
      sender_type: "lead",
      message_body: text,
      channel: "telegram",
      telegram_message_id: telegramMessageId,
    });
    
  if (msgError) throw new Error(msgError.message);

  await supabase
    .from("conversation_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", thread.id);

  if (thread.status === "active") {
    const { processAIGeneration } = await import("@/lib/ai/pipeline");
    await processAIGeneration(workspaceId, thread.id);
  }
}
