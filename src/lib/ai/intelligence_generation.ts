import { createClient } from "@supabase/supabase-js";
import { routeAIRequest } from "./router";

export async function generateLeadIntelligence(workspaceId: string, leadId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [{ data: lead }, { data: keys }, { data: memories }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", leadId).single(),
    supabase.from("workspace_settings").select("*").eq("workspace_id", workspaceId).single(),
    supabase.from("ai_memories").select("*").eq("lead_id", leadId).limit(20)
  ]);

  if (!lead || !keys) return;

  const intelPrompt = `Based on the lead's profile and extracted memories, generate strategic lead intelligence.
Profile: Name: ${lead.full_name}, Intent: ${lead.intent}, Status: ${lead.status}
Memories:
${memories?.map(m => `- [${m.memory_type}] ${m.memory_value}`).join("\n")}

Respond with a raw JSON object only (no markdown):
{
  "qualification": "string",
  "priority": "low|medium|high|critical",
  "health_score": number (0-100),
  "opportunity": "string",
  "recommended_action": "string",
  "lead_score": number (0-10)
}`;

  // Use large reasoning model for intelligence generation
  const response = await routeAIRequest(keys, [{ role: "system", content: intelPrompt }], "large");

  try {
    const rawContent = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
    const intel = JSON.parse(rawContent);

    // Update lead intelligence table
    await supabase.from("lead_intelligence").upsert({
      lead_id: leadId,
      workspace_id: workspaceId,
      qualification: intel.qualification,
      priority: intel.priority,
      health_score: intel.health_score,
      opportunity: intel.opportunity,
      recommended_action: intel.recommended_action,
      last_generated_at: new Date().toISOString()
    });

    // Lead Score Engine: Update actual lead table
    if (typeof intel.lead_score === "number") {
      await supabase.from("leads").update({ lead_score: intel.lead_score }).eq("id", leadId);
    }
  } catch (e) {
    console.error("[Intelligence Generation] Failed to parse JSON", e);
  }
}
