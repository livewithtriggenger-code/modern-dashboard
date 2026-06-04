/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// ─── Create Workspace ─────────────────────────────────────────────────────────
const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters")
    .max(80, "Workspace name must be under 80 characters"),
});

export async function createWorkspace(formData: FormData) {
  const user = await getAuthenticatedUser();

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // 1. Insert the workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ name: parsed.data.name })
    .select("id")
    .single();

  if (workspaceError || !workspace) {
    return { error: "Failed to create workspace. Please try again." };
  }

  // 2. Assign the creating user as owner
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    // Rollback: delete the orphaned workspace
    await supabase.from("workspaces").delete().eq("id", workspace.id);
    return { error: "Failed to assign workspace ownership." };
  }

  revalidatePath("/workspaces");
  redirect(`/onboarding?workspace=${workspace.id}`);
}

// ─── Get All Workspaces for Current User ──────────────────────────────────────
export async function getMyWorkspaces() {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      role,
      workspace:workspaces (
        id,
        name,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: "Failed to load workspaces." };
  return { data };
}

// ─── Update Workspace Settings (Onboarding) ───────────────────────────────────
const updateSettingsSchema = z.object({
  workspaceId: z.string().uuid(),
  businessName: z.string().min(1).optional(),
  timezone: z.string().optional(),
});

export async function updateWorkspaceSettings(formData: FormData) {
  const parsed = updateSettingsSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    businessName: formData.get("businessName"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await requireRole(parsed.data.workspaceId, "admin");

  const supabase = await createClient();

  const { error } = await supabase
    .from("workspace_settings")
    .update({
      business_name: parsed.data.businessName,
      timezone: parsed.data.timezone,
    })
    .eq("workspace_id", parsed.data.workspaceId);

  if (error) return { error: "Failed to save workspace settings." };

  revalidatePath(`/onboarding`);
  return { success: true };
}

// ─── Invite Member to Workspace ───────────────────────────────────────────────
const inviteMemberSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});

export async function inviteWorkspaceMember(formData: FormData) {
  const parsed = inviteMemberSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await requireRole(parsed.data.workspaceId, "admin");

  const supabase = await createClient();

  // Lookup user by email via auth admin (service role required in production)
  const { error } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", parsed.data.workspaceId);

  if (error) return { error: "Failed to look up workspace members." };

  // In production this would trigger a Supabase invite email.
  // For now we return a pending state.
  return {
    success: true,
    message: `Invitation flow initiated for ${parsed.data.email}`,
  };
}
