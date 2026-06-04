import { useQuery } from "@tanstack/react-query";
import { getAnalyticsMetrics } from "@/actions/analytics";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function useAnalyticsMetrics(daysBack: number = 30) {
  const { workspaceId } = useWorkspace();
  return useQuery({
    queryKey: ["analytics", workspaceId, daysBack],
    queryFn: () => getAnalyticsMetrics(workspaceId, daysBack),
  });
}

export function useRealtimeAnalyticsRefresh(daysBack: number = 30) {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const filter = `workspace_id=eq.${workspaceId}`;

    const handleInvalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", workspaceId, daysBack] });
    };

    // We subscribe to all primary tables affecting analytics to refresh the data
    const leadsChannel = supabase.channel('realtime:analytics:leads').on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter }, handleInvalidate).subscribe();
    const aptChannel = supabase.channel('realtime:analytics:appointments').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter }, handleInvalidate).subscribe();
    const threadChannel = supabase.channel('realtime:analytics:threads').on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_threads', filter }, handleInvalidate).subscribe();
    const followUpChannel = supabase.channel('realtime:analytics:followups').on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups', filter }, handleInvalidate).subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(aptChannel);
      supabase.removeChannel(threadChannel);
      supabase.removeChannel(followUpChannel);
    };
  }, [workspaceId, daysBack, queryClient]);
}
