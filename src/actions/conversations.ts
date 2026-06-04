/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { enqueueOutboundMessage } from "@/lib/queue/service";
import { createNotification } from "@/lib/notifications";
import { UUIDSchema } from "@/lib/validations";
import { z } from "zod";

export async function getThreads(workspaceId: string, statusFilter = "all") {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  const supabase = await createClient();

  let query = supabase
    .from("conversation_threads")
    .select("*, leads(*)")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getMessages(workspaceId: string, threadId: string) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(threadId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("thread_id", threadId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAIMemories(workspaceId: string, leadId: string) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(leadId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_memories")
    .select("*")
    .eq("lead_id", leadId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function sendMessage(workspaceId: string, threadId: string, rawContent: unknown) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(threadId);
  const content = z.string().min(1).parse(rawContent);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      workspace_id: workspaceId,
      thread_id: threadId,
      sender_type: "human_operator",
      message_body: content,
      channel: "web",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Update thread updated_at and pause AI since human sent a message
  await supabase
    .from("conversation_threads")
    .update({ updated_at: new Date().toISOString(), status: "paused" })
    .eq("id", threadId);

  // Dispatch to Outbound Queue for Telegram delivery
  await enqueueOutboundMessage(workspaceId, data.id);

  return data;
}

export async function updateThreadStatus(workspaceId: string, threadId: string, rawStatus: unknown) {
  await getAuthenticatedUser();
  UUIDSchema.parse(workspaceId);
  UUIDSchema.parse(threadId);
  const status = z.string().parse(rawStatus);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversation_threads")
    .update({ status })
    .eq("id", threadId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (status === "paused") {
    await createNotification(workspaceId, "ai_escalation", "AI Escalation", "A conversation thread requires human intervention.", `/conversations`);
  }

  return data;
}
