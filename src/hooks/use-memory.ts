import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMemories, updateMemory, deleteMemory } from "@/actions/memory";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { toast } from "sonner";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useMemoriesQuery(leadId?: string) {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["ai_memories", workspaceId, leadId],
    queryFn: () => getMemories(workspaceId, leadId),
  });
}

export function useMemoryMutations() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: ({ memoryId, value }: { memoryId: string; value: string }) => 
      updateMemory(workspaceId, memoryId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_memories", workspaceId] });
      toast.success("Memory updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (memoryId: string) => deleteMemory(workspaceId, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_memories", workspaceId] });
      toast.success("Memory deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { update, remove };
}

export function useRealtimeMemories(leadId?: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    const supabase = createClient();
    let filter = `workspace_id=eq.${workspaceId}`;
    if (leadId) filter += `&lead_id=eq.${leadId}`;

    const channel = supabase
      .channel(`realtime:memories:${leadId || 'all'}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_memories",
          filter,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ai_memories", workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient, workspaceId]);
}
