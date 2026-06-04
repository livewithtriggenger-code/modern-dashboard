import { createClient } from "@/lib/supabase/server";

export async function logAuditAction(
  workspaceId: string,
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      workspace_id: workspaceId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
  } catch (error) {
    console.error("[AuditLog] Failed to write log:", error);
  }
}
