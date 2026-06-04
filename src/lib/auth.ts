import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { WorkspaceRole } from "@/types/database.types";

/**
 * Returns the currently authenticated user.
 * Redirects to /login if no session exists.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

/**
 * Returns all workspaces the current user belongs to,
 * including their role in each workspace.
 */
export async function getUserWorkspaces() {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      role,
      workspaces (
        id,
        name,
        created_at
      )
    `)
    .eq("user_id", user.id);

  if (error) throw new Error("Failed to load workspaces");

  return data ?? [];
}

/**
 * Returns the user's role within a specific workspace.
 * Returns null if the user is not a member.
 */
export async function getUserRoleInWorkspace(
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!data) return null;
  return (data as { role: WorkspaceRole }).role;
}

/**
 * Guards a server action or route by enforcing a minimum role.
 * Throws if the user doesn't meet the role requirement.
 */
export async function requireRole(
  workspaceId: string,
  minimumRole: WorkspaceRole
) {
  const role = await getUserRoleInWorkspace(workspaceId);
  const hierarchy: WorkspaceRole[] = ["member", "admin", "owner"];

  if (!role || hierarchy.indexOf(role) < hierarchy.indexOf(minimumRole)) {
    throw new Error("Insufficient permissions for this action.");
  }

  return role;
}
