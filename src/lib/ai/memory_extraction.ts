import { createClient } from "@supabase/supabase-js";
import { routeAIRequest } from "./router";

export async function extractAIMemories(workspaceId: string, threadId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [{ data: thread }, { data: keys }] = await Promise.all([
    supabase.from("conversation_threads").select("*, leads(*)").eq("id", threadId).single(),
    supabase.from("workspace_settings").select("*").eq("workspace_id", workspaceId).single()
  ]);

  if (!thread || !keys) return;

  const { data: history } = await supabase
    .from("conversations")
    .select("sender_type, message_body")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (!history || history.length === 0) return;

  const extractionPrompt = `Analyze the following recent conversation snippet. Extract strict factual information about the lead (${thread.leads.full_name}).
Format as a raw JSON array of objects without markdown blocks:
[{ "type": "preference|behavior|context|intent|objection|timeline|budget", "value": "Extracted fact", "confidence": 85 }]
If no new facts, return [].

Conversation:
${history.reverse().map(m => `${m.sender_type}: ${m.message_body}`).join("\n")}`;

  const messages = [{ role: "system", content: extractionPrompt }];
  
  // Use medium model for extraction (Cost Optimization Layer)
  const response = await routeAIRequest(keys, messages, "medium");

  try {
    const rawContent = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const facts: any[] = JSON.parse(rawContent);

    for (const fact of facts) {
      // Memory Confidence Framework
      if (fact.confidence >= 60) {
        await supabase.from("ai_memories").insert({
          workspace_id: workspaceId,
          lead_id: thread.lead_id,
          source_message_id: null,
          created_by: "ai",
          confidence_score: fact.confidence,
          memory_type: fact.type,
          memory_value: fact.value
        });
      }
    }
  } catch (e) {
    console.error("[Memory Extraction] Failed to parse JSON", e);
  }
}
