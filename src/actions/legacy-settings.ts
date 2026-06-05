"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveLegacySettings(settings: {
  sheets_url: string;
  sheets_client_email: string;
  sheets_private_key: string;
  telegram_bot_token: string;
}) {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!membership) {
    throw new Error("No workspace found");
  }

  // Fetch current legacy settings to merge
  const { data: current } = await supabase
    .from("workspace_settings")
    .select("legacy_settings")
    .eq("workspace_id", membership.workspace_id)
    .single();

  const legacy_settings = {
    ...(current?.legacy_settings || {}),
    ...settings
  };

  const { error } = await supabase
    .from("workspace_settings")
    .update({ legacy_settings })
    .eq("workspace_id", membership.workspace_id);

  if (error) {
    console.error("Error saving legacy settings:", error);
    throw new Error("Failed to save settings");
  }

  return { success: true };
}
