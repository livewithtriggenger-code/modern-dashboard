import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWorkspaceSettings, updateWorkspaceSettings, getBusinessKnowledge, addBusinessKnowledge, deleteBusinessKnowledge, testIntegrationHealth } from "@/actions/settings";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { toast } from "sonner";

export function useSettings() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["settings", workspaceId],
    queryFn: () => getWorkspaceSettings(workspaceId),
  });

  const knowledgeQuery = useQuery({
    queryKey: ["knowledge", workspaceId],
    queryFn: () => getBusinessKnowledge(workspaceId),
  });

  const updateSettings = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: any) => updateWorkspaceSettings(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", workspaceId] });
      toast.success("Settings updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addKnowledge = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => addBusinessKnowledge(workspaceId, key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", workspaceId] });
      toast.success("Knowledge added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteKnowledge = useMutation({
    mutationFn: (id: string) => deleteBusinessKnowledge(workspaceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", workspaceId] });
      toast.success("Knowledge deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkHealth = useMutation({
    mutationFn: (integration: string) => testIntegrationHealth(workspaceId, integration),
    onSuccess: (data) => toast.success(data.message),
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    settingsQuery,
    knowledgeQuery,
    updateSettings,
    addKnowledge,
    deleteKnowledge,
    checkHealth
  };
}
