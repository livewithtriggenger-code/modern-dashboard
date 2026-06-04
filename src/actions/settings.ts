"use server"

import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, requireRole } from "@/lib/auth"
import { encrypt } from "@/lib/encryption"
import { UUIDSchema, UpdateSettingsSchema } from "@/lib/validations"
import { logAuditAction } from "@/lib/audit"

export async function getWorkspaceSettings(workspaceId: string) {
  await getAuthenticatedUser();
  await requireRole(workspaceId, "admin");
  UUIDSchema.parse(workspaceId);
  
  const supabase = await createClient();
  const { data } = await supabase.from("workspace_settings").select("*").eq("workspace_id", workspaceId).single();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = data as any;

  if (!settings) return null;

  // Mask sensitive keys
  return {
    ...settings,
    openai_key: settings.openai_key ? "********" : "",
    claude_key: settings.claude_key ? "********" : "",
    telegram_bot_token: settings.telegram_bot_token ? "********" : "",
    calendar_client_secret: settings.calendar_client_secret ? "********" : "",
    sheets_client_secret: settings.sheets_client_secret ? "********" : "",
  };
}

export async function updateWorkspaceSettings(workspaceId: string, rawPayload: unknown) {
  const user = await getAuthenticatedUser();
  await requireRole(workspaceId, "admin");
  UUIDSchema.parse(workspaceId);
  const payload = UpdateSettingsSchema.parse(rawPayload);
  const supabase = await createClient();

  const updateData = { ...payload } as any;

  // Encrypt sensitive keys
  const keysToEncrypt = ["openai_key", "claude_key", "telegram_bot_token", "calendar_client_secret", "sheets_client_secret"];
  
  for (const key of keysToEncrypt) {
    if (updateData[key]) {
      if (updateData[key] !== "********") {
        updateData[key] = encrypt(updateData[key]);
      } else {
        delete updateData[key];
      }
    }
  }

  const { error } = await supabase
    .from("workspace_settings")
    // @ts-expect-error supabase type never
    .update(updateData)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getBusinessKnowledge(workspaceId: string) {
  await getAuthenticatedUser();
  await requireRole(workspaceId, "admin");
  UUIDSchema.parse(workspaceId);
  const supabase = await createClient();
  const { data } = await supabase.from("business_knowledge").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
  return data;
}

export async function addBusinessKnowledge(workspaceId: string, key: string, value: string) {
  await getAuthenticatedUser();
  await requireRole(workspaceId, "admin");
  UUIDSchema.parse(workspaceId);
  const supabase = await createClient();
  // @ts-expect-error supabase type never
  const { data, error } = await supabase.from("business_knowledge").insert({ workspace_id: workspaceId, key, value }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBusinessKnowledge(workspaceId: string, id: string) {
  await getAuthenticatedUser();
  await requireRole(workspaceId, "admin");
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(id);
  const supabase = await createClient();
  const { error } = await supabase.from("business_knowledge").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function testIntegrationHealth(workspaceId: string, integration: string) {
  await getAuthenticatedUser();
  await requireRole(workspaceId, "admin");
  UUIDSchema.parse(workspaceId);
  // Mock health check
  return { status: "healthy", message: `Connected to ${integration}` };
}
