import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from "@/actions/appointments";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { toast } from "sonner";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAppointmentsQuery(statusFilter = "all") {
  const { workspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: ["appointments", workspaceId, statusFilter],
    queryFn: () => getAppointments(workspaceId, statusFilter),
  });
}

export function useAppointmentMutations() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const create = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: any) => createAppointment(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", workspaceId] });
      toast.success("Appointment scheduled successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAppointment(workspaceId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", workspaceId] });
      toast.success("Appointment updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAppointment(workspaceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", workspaceId] });
      toast.success("Appointment cancelled");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { create, update, remove };
}

export function useRealtimeAppointments() {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    const supabase = createClient();
    const filter = `workspace_id=eq.${workspaceId}`;

    const channel = supabase
      .channel(`realtime:appointments:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["appointments", workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, workspaceId]);
}
