import { createClient } from "@/lib/supabase/server";

export type NotificationType = "ai_escalation" | "follow_up" | "appointment" | "system";

export async function createNotification(
  workspaceId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    workspace_id: workspaceId,
    type,
    title,
    message,
    link,
    is_read: false
  } as any);

  if (error) {
    console.error("Failed to create notification:", error);
  }
}
