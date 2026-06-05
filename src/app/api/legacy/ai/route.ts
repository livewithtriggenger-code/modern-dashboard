import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getLegacySheetsClient, extractSpreadsheetId } from '@/legacy/providers/google-sheets-provider';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { prompt, conversationId, leadName, context } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Get Workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 403 });
    }

    // 2. Get Settings
    const { data: settings } = await supabase
      .from('workspace_settings')
      .select('legacy_settings, openai_key')
      .eq('workspace_id', membership.workspace_id)
      .single();

    if (!settings?.openai_key) {
      return NextResponse.json({ error: 'OpenAI API key not configured in workspace settings' }, { status: 400 });
    }

    const legacySettings = settings?.legacy_settings;
    
    // 3. Query OpenAI
    const openai = new OpenAI({ apiKey: settings.openai_key });
    
    const systemPrompt = `You are an AI sales assistant. ${leadName ? `You are talking to ${leadName}.` : ''} 
    Keep responses concise, helpful, and professional.
    Context about this lead: ${context || 'None provided.'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I could not generate a response.';

    // 4. Log to Google Sheets (if conversationId provided)
    if (conversationId && legacySettings && legacySettings.sheets_url) {
      try {
        const spreadsheetId = extractSpreadsheetId(legacySettings.sheets_url);
        if (spreadsheetId) {
          const sheets = await getLegacySheetsClient(legacySettings);
          const timestamp = new Date().toISOString();

          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Conversations!A:F',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [
                [
                  timestamp,
                  conversationId,
                  'ai',
                  aiResponse,
                  'System',
                  'Generated'
                ]
              ]
            }
          });
        }
      } catch (sheetError) {
        console.error('Failed to log AI response to sheets:', sheetError);
        // Do not fail the API call if logging fails, return the AI response anyway
      }
    }

    return NextResponse.json({ 
      success: true, 
      response: aiResponse 
    });
  } catch (error: any) {
    console.error('Legacy AI Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
