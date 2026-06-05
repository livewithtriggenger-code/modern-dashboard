"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function setUserMode(mode: "legacy" | "v2") {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  // Get user's primary workspace
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

  const { error } = await supabase
    .from("workspace_settings")
    .update({ mode })
    .eq("workspace_id", membership.workspace_id);

  if (error) {
    console.error("Error setting mode:", error);
    throw new Error("Failed to set mode");
  }

  // Return path to redirect on the client to avoid NEXT_REDIRECT try/catch swallowing
  if (mode === "legacy") {
    return { success: true, redirectTo: "/legacy/dashboard" };
  } else {
    return { success: true, redirectTo: "/dashboard" };
  }
}
