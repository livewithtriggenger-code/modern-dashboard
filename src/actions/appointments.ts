/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createGoogleCalendarEvent } from "@/lib/google/calendar";
import { createNotification } from "@/lib/notifications";
import { CreateAppointmentSchema, UpdateAppointmentSchema, UUIDSchema } from "@/lib/validations";

export async function getAppointments(workspaceId: string, statusFilter = "all") {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("*, leads(full_name, email)")
    .eq("workspace_id", workspaceId)
    .order("appointment_start", { ascending: true });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function createAppointment(workspaceId: string, rawPayload: unknown) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  const payload = CreateAppointmentSchema.parse(rawPayload);
  const supabase = await createClient();

  // Foundation for Google Calendar Integration
  const { google_event_id, meeting_link } = await createGoogleCalendarEvent(workspaceId, {
    lead_id: payload.lead_id,
    start: payload.appointment_start,
    end: payload.appointment_end
  });

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      workspace_id: workspaceId,
      lead_id: payload.lead_id,
      appointment_start: payload.appointment_start,
      appointment_end: payload.appointment_end,
      status: payload.status || "scheduled",
      meeting_link: meeting_link,
      google_event_id: google_event_id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (data) {
    await createNotification(
      workspaceId,
      "appointment",
      "New Appointment Booked",
      `A new appointment was scheduled.`,
      `/appointments`
    );
  }

  return data;
}

export async function updateAppointment(workspaceId: string, appointmentId: string, rawPayload: unknown) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(appointmentId);
  const payload = UpdateAppointmentSchema.parse(rawPayload);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .update(payload)
    .eq("id", appointmentId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAppointment(workspaceId: string, appointmentId: string) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(appointmentId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
  return { success: true };
}
