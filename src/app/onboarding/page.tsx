/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/workspaces/OnboardingWizard";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Set Up Workspace | NexusAI CRM",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string }>;
}) {
  const { workspace: workspaceId } = await searchParams;

  if (!workspaceId) {
    redirect("/workspaces");
  }

  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  // Verify the user is an admin/owner of this workspace
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect("/workspaces");
  }

  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("business_name, timezone, telegram_connected, calendar_connected")
    .eq("workspace_id", workspaceId)
    .single();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Set up your workspace
          </h1>
          <p className="text-muted-foreground text-sm">
            A few quick steps to get NexusAI running for your business.
          </p>
        </div>

        <OnboardingWizard
          workspaceId={workspaceId}
          initialSettings={settings}
        />
      </div>
    </div>
  );
}
