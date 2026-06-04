"use client";

import { createWorkspace } from "@/actions/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Check, ChevronRight } from "lucide-react";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface WorkspaceMembership {
  role: string;
  workspace: {
    id: string;
    name: string;
    created_at: string;
  } | null;
}

interface WorkspaceSelectorProps {
  workspaces: WorkspaceMembership[];
}

export function WorkspaceSelector({ workspaces }: WorkspaceSelectorProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createWorkspace(formData);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  const roleColors: Record<string, string> = {
    owner: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    admin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    member: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <div className="space-y-3">
      {/* Existing Workspaces */}
      {workspaces.length > 0 && (
        <div className="space-y-2">
          {workspaces.map((membership) => {
            if (!membership.workspace) return null;
            return (
              <Link
                key={membership.workspace.id}
                href={`/?workspace=${membership.workspace.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-violet-500/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {membership.workspace.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(membership.workspace.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      roleColors[membership.role] ?? roleColors.member
                    }`}
                  >
                    {membership.role}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {workspaces.length === 0 && !showCreate && (
        <div className="text-center py-12 rounded-xl border border-dashed border-border">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            You don&apos;t belong to any workspaces yet.
          </p>
        </div>
      )}

      {/* Create Workspace Form */}
      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3"
        >
          <p className="text-sm font-medium text-foreground">
            New workspace name
          </p>
          <Input
            name="name"
            placeholder="Acme Corp"
            required
            minLength={2}
            autoFocus
            disabled={isPending}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Create
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreate(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create new workspace
        </Button>
      )}
    </div>
  );
}
