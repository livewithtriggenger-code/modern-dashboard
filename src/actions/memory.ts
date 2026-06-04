/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function getMemories(workspaceId: string, leadId?: string) {
  await getAuthenticatedUser();
  const supabase = await createClient();

  let query = supabase
    .from("ai_memories")
    .select("*, leads(full_name)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (leadId) {
    query = query.eq("lead_id", leadId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMemory(workspaceId: string, memoryId: string, memory_value: string) {
  await getAuthenticatedUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_memories")
    .update({ memory_value, created_by: "human" })
    .eq("id", memoryId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMemory(workspaceId: string, memoryId: string) {
  await getAuthenticatedUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("ai_memories")
    .delete()
    .eq("id", memoryId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
  return { success: true };
}
