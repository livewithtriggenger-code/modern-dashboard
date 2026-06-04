import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser, getUserRoleInWorkspace } from "@/lib/auth";

/**
 * RBAC guard for Server Actions and Route Handlers.
 *
 * Usage:
 *   const { user, role } = await withWorkspaceAuth(workspaceId, "admin");
 *
 * Throws if:
 *  - User is not authenticated
 *  - User is not a member of the workspace
 *  - User does not have the required minimum role
 */
export async function withWorkspaceAuth(
  workspaceId: string,
  minimumRole: "member" | "admin" | "owner" = "member"
) {
  const user = await getAuthenticatedUser();
  const role = await getUserRoleInWorkspace(workspaceId);

  if (!role) {
    throw new Error("Access denied: you are not a member of this workspace.");
  }

  const hierarchy = ["member", "admin", "owner"] as const;
  if (hierarchy.indexOf(role) < hierarchy.indexOf(minimumRole)) {
    throw new Error(`Access denied: requires ${minimumRole} role.`);
  }

  return { user, role };
}

/**
 * Returns the workspace settings row for a given workspace.
 * Validates membership before returning.
 * API keys are returned REDACTED — never raw to any Server Component.
 */
export async function getWorkspaceSettings(workspaceId: string) {
  await withWorkspaceAuth(workspaceId, "member");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_settings")
    .select(
      "workspace_id, business_name, timezone, working_hours, telegram_connected, calendar_connected, sheets_connected"
    )
    .eq("workspace_id", workspaceId)
    .single();

  if (error) throw new Error("Failed to load workspace settings.");
  return data;
}
