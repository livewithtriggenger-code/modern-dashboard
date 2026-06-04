import { createClient } from "@supabase/supabase-js";
import { AIResponse } from "./types";

export async function logAIObservation(workspaceId: string, threadId: string, response: AIResponse) {
  // Fallback to console if no db configured
  console.log(`[AI Observability - ${workspaceId}]`, {
    threadId,
    provider: response.provider,
    latency: response.latencyMs,
    tokens: response.tokens,
    confidence: response.confidence,
    escalated: response.escalate
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Asynchronous fire-and-forget logging
  supabase.from("audit_logs").insert({
    workspace_id: workspaceId,
    action: response.error ? "ai_generation_error" : "ai_generation_success",
    entity_type: "conversation_threads",
    entity_id: threadId,
    metadata: {
      provider: response.provider,
      latency: response.latencyMs,
      tokens: response.tokens,
      confidence: response.confidence,
    }
  }).then(({ error }) => {
    if (error) console.error("[AI Observability Error]", error);
  });
}
