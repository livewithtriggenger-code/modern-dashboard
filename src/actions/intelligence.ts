/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function getLeadIntelligence(workspaceId: string, leadId: string) {
  await getAuthenticatedUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_intelligence")
    .select("*")
    .eq("lead_id", leadId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message); // Ignore no rows error
  return data;
}
