import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getThreads, getMessages, getAIMemories, sendMessage, updateThreadStatus } from "@/actions/conversations";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { toast } from "sonner";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useThreadsQuery(statusFilter = "all") {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["threads", workspaceId, statusFilter],
    queryFn: () => getThreads(workspaceId, statusFilter),
  });
}

export function useMessagesQuery(threadId: string | null) {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["messages", workspaceId, threadId],
    queryFn: () => getMessages(workspaceId, threadId!),
    enabled: !!threadId,
  });
}

export function useAIMemoriesQuery(leadId: string | null) {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["ai_memories", workspaceId, leadId],
    queryFn: () => getAIMemories(workspaceId, leadId!),
    enabled: !!leadId,
  });
}

export function useConversationMutations() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const send = useMutation({
    mutationFn: ({ threadId, content }: { threadId: string; content: string }) => 
      sendMessage(workspaceId, threadId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", workspaceId, variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads", workspaceId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: ({ threadId, status }: { threadId: string; status: string }) => 
      updateThreadStatus(workspaceId, threadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", workspaceId] });
      toast.success("Thread status updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { send, updateStatus };
}

export function useRealtimeMessages(threadId: string | null) {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!threadId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:conversations:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", workspaceId, threadId] });
          queryClient.invalidateQueries({ queryKey: ["threads", workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, queryClient, workspaceId]);
}
