import { createClient } from "@supabase/supabase-js";
import { TelegramClient } from "@/lib/telegram/client";

export async function processOutboundJobPayload(workspaceId: string, messageId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: message } = await supabase
    .from("conversations")
    .select("*, conversation_threads(*, leads(*))")
    .eq("id", messageId)
    .single();

  if (!message) throw new Error(`Message not found: ${messageId}`);

  // @ts-expect-error type override
  const lead = message.conversation_threads?.leads;
  if (!lead || !lead.telegram_chat_id) throw new Error("No telegram chat id mapped for this lead");

  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("telegram_bot_token")
    .eq("workspace_id", workspaceId)
    .single();

  if (!settings?.telegram_bot_token) throw new Error("No telegram token set for workspace");

  const telegram = new TelegramClient(settings.telegram_bot_token);
  const result = await telegram.sendMessage(lead.telegram_chat_id, message.message_body);

  if (result.ok) {
    await supabase
      .from("conversations")
      .update({ telegram_message_id: result.result.message_id.toString() })
      .eq("id", messageId);
  } else {
    throw new Error(`Telegram API failed: ${JSON.stringify(result)}`);
  }
}
