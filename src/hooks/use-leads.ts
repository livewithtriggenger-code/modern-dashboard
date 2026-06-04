import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeads, getLeadById, createLead, updateLead, deleteLead } from "@/actions/leads";
import { getLeadIntelligence } from "@/actions/intelligence";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { toast } from "sonner";

export function useLeadsQuery(page = 1, pageSize = 20, search = "", statusFilter = "all") {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["leads", workspaceId, page, pageSize, search, statusFilter],
    queryFn: () => getLeads(workspaceId, page, pageSize, search, statusFilter),
    placeholderData: (previousData) => previousData, // keep previous data while fetching
  });
}

export function useLeadQuery(leadId: string | null) {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["leads", workspaceId, leadId],
    queryFn: () => getLeadById(workspaceId, leadId!),
    enabled: !!leadId && leadId !== "new",
  });
}

export function useLeadMutation() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => createLead(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
      toast.success("Lead created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateLead(workspaceId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
      toast.success("Lead updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteLead(workspaceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
      toast.success("Lead deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { create, update, remove };
}

export function useIntelligenceQuery(leadId: string | null) {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["lead_intelligence", workspaceId, leadId],
    queryFn: () => getLeadIntelligence(workspaceId, leadId!),
    enabled: !!leadId && leadId !== "new",
  });
}

export function useRealtimeIntelligence(leadId: string | null) {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!leadId || leadId === "new") return;

    const supabase = createClient();
    const filter = `workspace_id=eq.${workspaceId}&lead_id=eq.${leadId}`;

    const channel = supabase
      .channel(`realtime:intelligence:${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_intelligence",
          filter,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["lead_intelligence", workspaceId, leadId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient, workspaceId]);
}
