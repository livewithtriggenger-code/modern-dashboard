import type { Metadata } from "next";
import { getMyWorkspaces } from "@/actions/workspaces";
import { WorkspaceSelector } from "@/components/workspaces/WorkspaceSelector";

export const metadata: Metadata = {
  title: "Select Workspace | NexusAI CRM",
};

export default async function WorkspacesPage() {
  const result = await getMyWorkspaces();
  const workspaces = result.data ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Select a workspace
          </h1>
          <p className="text-muted-foreground">
            Choose a workspace to continue, or create a new one.
          </p>
        </div>

        <WorkspaceSelector workspaces={workspaces} />
      </div>
    </div>
  );
}
