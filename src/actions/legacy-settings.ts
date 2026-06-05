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

  // Fetch current legacy settings to merge
  const { data: current } = await supabase
    .from("user_preferences")
    .select("legacy_settings")
    .eq("user_id", user.id)
    .single();

  const legacy_settings = {
    ...(current?.legacy_settings || {}),
    ...settings
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({ 
      user_id: user.id, 
      legacy_settings,
      mode: 'legacy' // Ensure mode is set if creating for the first time
    }, { onConflict: 'user_id' })
    .select()
    .single();

  console.log("SAVE DB RESPONSE:", data, error);

  if (error) {
    console.error("Error saving legacy settings:", error);
    throw new Error("Failed to save settings");
  }

  return { success: true };
}

export async function getLegacySettings() {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  console.log("LOAD PAYLOAD: fetching for user", user.id);

  const { data, error } = await supabase
    .from("user_preferences")
    .select("legacy_settings")
    .eq("user_id", user.id)
    .single();

  console.log("LOAD DB RESPONSE:", data, error);

  return data?.legacy_settings || {};
}
