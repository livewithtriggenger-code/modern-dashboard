import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFollowUps, updateFollowUp, triggerFollowUpGeneration } from "@/actions/follow_ups";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { toast } from "sonner";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useFollowUpsQuery(leadId?: string) {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["follow_ups", workspaceId, leadId],
    queryFn: () => getFollowUps(workspaceId, leadId),
  });
}

export function useFollowUpMutations() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const update = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, data }: { id: string; data: any }) => updateFollowUp(workspaceId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow_ups", workspaceId] });
      toast.success("Follow-up updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generate = useMutation({
    mutationFn: (leadId: string) => triggerFollowUpGeneration(workspaceId, leadId),
    onSuccess: () => {
      toast.success("Follow-up generation triggered");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { update, generate };
}

export function useRealtimeFollowUps(leadId?: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    const supabase = createClient();
    let filter = `workspace_id=eq.${workspaceId}`;
    if (leadId) filter += `&lead_id=eq.${leadId}`;

    const channel = supabase
      .channel(`realtime:follow_ups:${leadId || 'all'}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follow_ups",
          filter,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["follow_ups", workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient, workspaceId]);
}
