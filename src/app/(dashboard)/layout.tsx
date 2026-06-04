/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  // Get the most recently accessed workspace (for now, simply grab the first one)
  // In a full implementation, you'd check a cookie or user preference
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!membership) {
    redirect("/onboarding");
  }

  // Get user profile details for Header
  return (
    <WorkspaceProvider
      workspaceId={membership.workspace_id}
      role={membership.role as "owner" | "admin" | "member"}
    >
      <RealtimeProvider>
        <AppShell userEmail={user.email!} userName={user.user_metadata?.full_name}>
          {children}
        </AppShell>
      </RealtimeProvider>
    </WorkspaceProvider>
  );
}
