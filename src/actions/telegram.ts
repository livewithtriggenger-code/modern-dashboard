/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { TelegramClient } from "@/lib/telegram/client";

export async function connectTelegramBot(workspaceId: string, botToken: string) {
  await getAuthenticatedUser();
  const supabase = await createClient();

  // 1. Verify token works
  const client = new TelegramClient(botToken);
  
  // 2. Set Webhook
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telegram/${workspaceId}`;
  // Generate a secret token for Webhook Validation
  const secretToken = workspaceId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 255);
  
  const webhookRes = await client.setWebhook(webhookUrl, secretToken);
  if (!webhookRes.ok) {
    throw new Error("Failed to set Telegram webhook: " + webhookRes.description);
  }

  // 3. Save to workspace_settings
  const { error } = await supabase
    .from("workspace_settings")
    .upsert({
      workspace_id: workspaceId,
      telegram_bot_token: botToken,
      telegram_connected: true,
    });

  if (error) throw new Error(error.message);
  
  return { success: true };
}
