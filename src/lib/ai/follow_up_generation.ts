import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export async function generateFollowUp(workspaceId: string, leadId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [{ data: lead }, { data: keys }, { data: memories }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", leadId).single(),
    supabase.from("workspace_settings").select("*").eq("workspace_id", workspaceId).single(),
    supabase.from("ai_memories").select("*").eq("lead_id", leadId).limit(10)
  ]);

  if (!lead || !keys) return;

  const prompt = `You are a professional sales assistant. 
The lead ${lead.full_name} has gone silent or needs a follow-up.
Lead Context: Intent: ${lead.intent}, Urgency: ${lead.urgency}.
Memories: ${memories?.map(m => m.memory_value).join(", ")}

Write a concise, friendly, and highly personalized follow-up message (under 300 characters) to re-engage this lead.
Do not include subject lines or greetings like "Subject:". Just the raw message.`;

  let message = "";
  try {
    const openai = createOpenAI({ apiKey: keys.openai_key || process.env.OPENAI_API_KEY });
    const response = await generateText({
      model: openai("gpt-4o"),
      system: "You are a professional sales assistant.",
      prompt: prompt,
    });
    message = response.text.trim();
  } catch (error) {
    // Fallback if API keys are missing/invalid in this environment
    message = `Hi ${lead.full_name.split(' ')[0]}, just checking in to see if you had any further thoughts on our last conversation? Let me know if I can help!`;
  }

  const { error } = await supabase.from("follow_ups").insert({
    workspace_id: workspaceId,
    lead_id: leadId,
    suggested_message: message,
    status: "pending",
    created_by: "ai"
  });

  if (error) {
    console.error("[Follow-Up Generation] Failed to insert", error);
  }
}
