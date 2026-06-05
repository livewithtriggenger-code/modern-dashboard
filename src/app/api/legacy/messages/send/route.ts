import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getLegacySheetsClient, extractSpreadsheetId } from '@/legacy/providers/google-sheets-provider';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { conversationId, message, sender = 'human' } = await request.json();

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Conversation ID and message are required' }, { status: 400 });
    }

    // Fetch legacy settings from user_preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('legacy_settings')
      .eq('user_id', user.id)
      .single();

    const legacySettings = preferences?.legacy_settings;
    if (!legacySettings || !legacySettings.sheets_url) {
      return NextResponse.json({ error: 'Google Sheets URL not configured in legacy settings' }, { status: 400 });
    }
    
    if (!legacySettings.telegram_bot_token) {
      return NextResponse.json({ error: 'Telegram Bot Token not configured in legacy settings' }, { status: 400 });
    }

    // 3. Send via Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${legacySettings.telegram_bot_token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: conversationId,
        text: message,
      }),
    });

    if (!telegramResponse.ok) {
      const tgError = await telegramResponse.text();
      console.error('Telegram API Error:', tgError);
      throw new Error(`Failed to send Telegram message: ${tgError}`);
    }

    // 4. Log to Google Sheets
    const spreadsheetId = extractSpreadsheetId(legacySettings.sheets_url);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const sheets = await getLegacySheetsClient(legacySettings);
    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Conversations!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            timestamp,       // Timestamp
            conversationId,  // Conversation ID
            sender,          // Sender
            message,         // Message
            'Telegram',      // Platform
            'Sent'           // Status
          ]
        ]
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent and logged',
      data: {
        timestamp,
        conversationId,
        sender,
        message,
        platform: 'Telegram',
        status: 'Sent'
      }
    });
  } catch (error: any) {
    console.error('Legacy Send Message Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
