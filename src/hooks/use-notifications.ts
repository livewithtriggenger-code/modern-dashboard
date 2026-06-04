import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useNotifications() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", workspaceId],
    queryFn: () => getNotifications(workspaceId),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markAsRead(workspaceId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllAsRead(workspaceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] }),
  });

  return {
    query,
    markRead,
    markAllRead
  };
}

export function useRealtimeNotifications() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;
    const supabase = createClient();
    
    const channel = supabase.channel('realtime:notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `workspace_id=eq.${workspaceId}` 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
}
