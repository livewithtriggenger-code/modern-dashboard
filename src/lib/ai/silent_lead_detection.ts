import { createClient } from "@supabase/supabase-js";
import { generateFollowUp } from "./follow_up_generation";

export async function detectSilentLeads(workspaceId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Look for leads with lead_score >= 7.0, status in (new, contacted), no messages in last 48h
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // We find leads that haven't been updated recently but have high score
  // In a real production system, this would be a more complex query joining conversations table
  const { data: silentLeads, error } = await supabase
    .from("leads")
    .select("id, full_name, updated_at")
    .eq("workspace_id", workspaceId)
    .in("status", ["new", "contacted"])
    .gte("lead_score", 7)
    .lte("updated_at", twoDaysAgo);

  if (error) {
    console.error("[Silent Lead Detection] Error fetching leads", error);
    return;
  }

  // Trigger follow-up generation for each detected silent lead
  if (silentLeads && silentLeads.length > 0) {
    for (const lead of silentLeads) {
      await generateFollowUp(workspaceId, lead.id).catch(console.error);
    }
  }

  return silentLeads;
}
