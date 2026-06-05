import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ModeSelector } from "./ModeSelector";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Select Mode | NexusAI CRM",
};

export default async function SelectModePage() {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  // Get user's primary workspace mode
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (membership) {
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("mode")
      .eq("workspace_id", membership.workspace_id)
      .single();

  // If no mode is set, render the selection screen
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Welcome to NexusAI CRM
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Choose your preferred workspace mode. You can always change this later in Settings.
          </p>
        </div>

        <ModeSelector 
          userId={user.id} 
          workspaceId={membership?.workspace_id || ""} 
          currentMode={settings?.mode || "none"} 
        />
      </div>
    </div>
  );
}
