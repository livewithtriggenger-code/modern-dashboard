"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function setUserMode(mode: "legacy" | "v2") {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  // Upsert into user_preferences to automatically bootstrap if it doesn't exist
  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { 
        user_id: user.id, 
        mode,
        legacy_settings: {} // Ensure legacy_settings is not null if creating for the first time
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error("Error setting mode in user_preferences:", error);
    return { success: false, error: "Failed to update mode in database", redirectTo: null };
  }

  // Revalidate all relevant paths to clear Next.js cache
  revalidatePath("/select-mode");
  revalidatePath("/");
  revalidatePath("/legacy/dashboard");
  revalidatePath("/dashboard");

  // Return redirect destination — client handles actual navigation
  return {
    success: true,
    redirectTo: mode === "legacy" ? "/legacy/dashboard" : "/dashboard"
  };
}

