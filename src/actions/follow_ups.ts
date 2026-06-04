// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { UpdateFollowUpSchema, UUIDSchema } from "@/lib/validations";

export async function getFollowUps(workspaceId: string, leadId?: string) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  if (leadId) UUIDSchema.parse(leadId);
  const supabase = await createClient();

  let query = supabase
    .from("follow_ups")
    .select("*, leads(full_name, email)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (leadId) {
    query = query.eq("lead_id", leadId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function updateFollowUp(workspaceId: string, followUpId: string, rawPayload: unknown) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(followUpId);
  const payload = UpdateFollowUpSchema.parse(rawPayload);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("follow_ups")
    .update(payload)
    .eq("id", followUpId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (payload.status === "pending") {
    await createNotification(workspaceId, "follow_up", "Follow-Up Action Needed", "A new follow-up requires your approval.", `/leads/${data.lead_id}`);
  }

  return data;
}

export async function triggerFollowUpGeneration(workspaceId: string, leadId: string) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(leadId);
  
  // Asynchronously trigger generation
  const { generateFollowUp } = await import("@/lib/ai/follow_up_generation");
  generateFollowUp(workspaceId, leadId).catch(console.error);

  return { success: true };
}
