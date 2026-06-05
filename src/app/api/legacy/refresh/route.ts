import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getLegacySheetsClient, extractSpreadsheetId } from '@/legacy/providers/google-sheets-provider';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

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

    const spreadsheetId = extractSpreadsheetId(legacySettings.sheets_url);
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 });
    }

    // 3. Init Sheets Client
    const sheets = await getLegacySheetsClient(legacySettings);

    // 4. Fetch Data from all 6 tabs
    const ranges = [
      'Leads!A2:S',
      'Conversations!A2:F',
      'Appointments!A2:J',
      'AI_Memory!A2:G',
      'Follow_Ups!A2:H',
      'Business_Knowledge!A2:D'
    ];

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const valueRanges = response.data.valueRanges;
    if (!valueRanges) {
      throw new Error('Failed to fetch data from sheets');
    }

    // Map rows to exact V1 objects
    const leads = (valueRanges[0].values || []).map((row, i) => ({
      row: i + 2,
      date: row[0] || '',
      fullName: row[1] || '',
      email: row[2] || '',
      phone: row[3] || '',
      source: row[4] || '',
      businessName: row[5] || '',
      businessType: row[6] || '',
      leadScore: row[7] || '',
      status: row[8] || '',
      intent: row[9] || '',
      urgency: row[10] || '',
      aiSummary: row[11] || '',
      recommendedAction: row[12] || '',
      lastContactDate: row[13] || '',
      nextFollowUpDate: row[14] || '',
      conversationId: row[15] || '',
      assignedTo: row[16] || '',
      tags: row[17] || '',
      notes: row[18] || ''
    }));

    const conversations = (valueRanges[1].values || []).map((row, i) => ({
      row: i + 2,
      timestamp: row[0] || '',
      conversationId: row[1] || '',
      sender: row[2] || 'human',
      message: row[3] || '',
      platform: row[4] || '',
      status: row[5] || ''
    }));

    const appointments = (valueRanges[2].values || []).map((row, i) => ({
      row: i + 2,
      dateCreated: row[0] || '',
      appointmentDate: row[1] || '',
      appointmentTime: row[2] || '',
      leadName: row[3] || '',
      leadPhone: row[4] || '',
      leadEmail: row[5] || '',
      status: row[6] || '',
      notes: row[7] || '',
      meetingLink: row[8] || '',
      googleEventId: row[9] || ''
    }));

    const memory = (valueRanges[3].values || []).map((row, i) => ({
      row: i + 2,
      dateAdded: row[0] || '',
      leadName: row[1] || '',
      leadPhone: row[2] || '',
      memoryType: row[3] || '',
      content: row[4] || '',
      source: row[5] || '',
      confidenceScore: row[6] || ''
    }));

    const followUps = (valueRanges[4].values || []).map((row, i) => ({
      row: i + 2,
      dateCreated: row[0] || '',
      scheduledDate: row[1] || '',
      scheduledTime: row[2] || '',
      leadName: row[3] || '',
      leadPhone: row[4] || '',
      messageTemplate: row[5] || '',
      status: row[6] || '',
      actualSentTime: row[7] || ''
    }));

    const knowledge = (valueRanges[5].values || []).map((row, i) => ({
      row: i + 2,
      category: row[0] || '',
      key: row[1] || '',
      value: row[2] || '',
      lastUpdated: row[3] || ''
    }));

    return NextResponse.json({
      leads,
      conversations,
      appointments,
      memory,
      followUps,
      knowledge
    });
  } catch (error: any) {
    console.error('Legacy Refresh Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
