"use server"

import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth"

export async function getNotifications(workspaceId: string) {
  await getAuthenticatedUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    // If the table doesn't exist, return empty array to prevent crashing before migration
    if (error.code === '42P01') return [];
    throw new Error(error.message);
  }
  return data;
}

export async function markAsRead(workspaceId: string, notificationId: string) {
  await getAuthenticatedUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    // @ts-expect-error supabase type never
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function markAllAsRead(workspaceId: string) {
  await getAuthenticatedUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    // @ts-expect-error supabase type never
    .update({ is_read: true })
    .eq("workspace_id", workspaceId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  return { success: true };
}
