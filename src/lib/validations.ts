import { z } from "zod";

export const UUIDSchema = z.string().uuid();

export const CreateLeadSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  source: z.string().optional(),
  business_type: z.string().optional(),
  status: z.enum(["new", "qualified", "contacted", "converted", "lost"]).optional().default("new"),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export const CreateAppointmentSchema = z.object({
  lead_id: UUIDSchema,
  appointment_start: z.string().datetime(),
  appointment_end: z.string().datetime(),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no-show"]).optional().default("scheduled"),
});

export const UpdateAppointmentSchema = CreateAppointmentSchema.partial();

export const UpdateFollowUpSchema = z.object({
  status: z.enum(["pending", "sent", "failed", "paused"]).optional(),
  scheduled_time: z.string().datetime().optional(),
  message_payload: z.string().optional(),
});

export const UpdateSettingsSchema = z.object({
  business_name: z.string().optional(),
  timezone: z.string().optional(),
  working_hours: z.string().optional(),
  active_ai_provider: z.string().optional(),
  openai_key: z.string().optional().or(z.literal("")),
  claude_key: z.string().optional().or(z.literal("")),
  telegram_bot_token: z.string().optional().or(z.literal("")),
  calendar_client_secret: z.string().optional().or(z.literal("")),
  sheets_client_secret: z.string().optional().or(z.literal("")),
  notification_preferences: z.record(z.boolean()).optional(),
});
