import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getLegacySheetsClient, extractSpreadsheetId } from '@/legacy/providers/google-sheets-provider';

// Hardcoded expected tabs for the legacy CRM
const EXPECTED_TABS = [
  { key: 'leads', expectedNames: ['Leads', 'Lead', 'Contacts', 'Sheet1'], range: 'A2:S' },
  { key: 'conversations', expectedNames: ['Conversations', 'Messages', 'Chat', 'Sheet2'], range: 'A2:F' },
  { key: 'appointments', expectedNames: ['Appointments', 'Meetings', 'Calendar', 'Sheet3'], range: 'A2:J' },
  { key: 'memory', expectedNames: ['AI_Memory', 'Memory', 'AI Memory', 'Sheet4'], range: 'A2:G' },
  { key: 'followUps', expectedNames: ['Follow_Ups', 'FollowUps', 'Follow Ups', 'Tasks', 'Sheet5'], range: 'A2:H' },
  { key: 'knowledge', expectedNames: ['Business_Knowledge', 'Knowledge', 'Business Knowledge', 'Settings', 'Sheet6'], range: 'A2:D' }
];

export async function GET() {
  const diagnostics: any = {};
  
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // 1. Fetch Legacy Settings
    diagnostics.step1_fetchSettings = "Started";
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('legacy_settings')
      .eq('user_id', user.id)
      .single();

    const legacySettings = preferences?.legacy_settings;
    if (!legacySettings || !legacySettings.sheets_url) {
      return NextResponse.json({ error: 'Google Sheets URL not configured in legacy settings', diagnostics }, { status: 400 });
    }
    diagnostics.step1_fetchSettings = "Success";

    // 2. Extract Spreadsheet ID
    diagnostics.step2_extractId = "Started";
    const spreadsheetId = extractSpreadsheetId(legacySettings.sheets_url);
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Invalid Google Sheets URL format', diagnostics }, { status: 400 });
    }
    diagnostics.spreadsheetId = spreadsheetId;
    diagnostics.step2_extractId = "Success";

    // 3. Init Sheets Client
    diagnostics.step3_initClient = "Started";
    const sheets = await getLegacySheetsClient(legacySettings);
    diagnostics.step3_initClient = "Success";

    // 4. Fetch Spreadsheet Metadata (To discover exact Worksheet names)
    diagnostics.step4_fetchMetadata = "Started";
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadataResponse.data.sheets?.map(s => s.properties?.title) || [];
    diagnostics.availableSheets = availableSheets;
    diagnostics.step4_fetchMetadata = "Success";

    // 5. Dynamic Tab Matching
    diagnostics.step5_tabMatching = "Started";
    const rangeRequests: string[] = [];
    const mappedKeys: string[] = [];

    for (const tabDef of EXPECTED_TABS) {
      // Find a matching sheet name from the user's actual spreadsheet
      const matchedName = tabDef.expectedNames.find(name => availableSheets.includes(name));
      
      if (matchedName) {
        rangeRequests.push(`${matchedName}!${tabDef.range}`);
        mappedKeys.push(tabDef.key);
      } else {
        diagnostics[`missingTab_${tabDef.key}`] = `Could not find any of: ${tabDef.expectedNames.join(', ')}`;
      }
    }
    
    diagnostics.rangeRequests = rangeRequests;
    diagnostics.mappedKeys = mappedKeys;
    diagnostics.step5_tabMatching = "Success";

    if (rangeRequests.length === 0) {
      return NextResponse.json({ 
        error: 'No valid CRM worksheets found in this spreadsheet. Expected tabs like Leads, Conversations, Appointments, etc.', 
        diagnostics 
      }, { status: 400 });
    }

    // 6. Fetch Data Batch
    diagnostics.step6_batchGet = "Started";
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: rangeRequests,
    });

    const valueRanges = response.data.valueRanges;
    if (!valueRanges) {
      throw new Error('Google API returned empty valueRanges');
    }
    diagnostics.step6_batchGet = "Success";

    // 7. Data Mapping
    diagnostics.step7_dataMapping = "Started";
    const result: any = {
      leads: [],
      conversations: [],
      appointments: [],
      memory: [],
      followUps: [],
      knowledge: []
    };

    valueRanges.forEach((rangeData, index) => {
      const key = mappedKeys[index];
      const rows = rangeData.values || [];
      diagnostics[`loaded_${key}`] = rows.length;

      if (key === 'leads') {
        result.leads = rows.map((row, i) => ({
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
      } else if (key === 'conversations') {
        result.conversations = rows.map((row, i) => ({
          row: i + 2,
          timestamp: row[0] || '',
          conversationId: row[1] || '',
          sender: row[2] || 'human',
          message: row[3] || '',
          platform: row[4] || '',
          status: row[5] || ''
        }));
      } else if (key === 'appointments') {
        result.appointments = rows.map((row, i) => ({
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
      } else if (key === 'memory') {
        result.memory = rows.map((row, i) => ({
          row: i + 2,
          dateAdded: row[0] || '',
          leadName: row[1] || '',
          leadPhone: row[2] || '',
          memoryType: row[3] || '',
          content: row[4] || '',
          source: row[5] || '',
          confidenceScore: row[6] || ''
        }));
      } else if (key === 'followUps') {
        result.followUps = rows.map((row, i) => ({
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
      } else if (key === 'knowledge') {
        result.knowledge = rows.map((row, i) => ({
          row: i + 2,
          category: row[0] || '',
          key: row[1] || '',
          value: row[2] || '',
          lastUpdated: row[3] || ''
        }));
      }
    });

    diagnostics.step7_dataMapping = "Success";

    return NextResponse.json({
      ...result,
      diagnostics
    });

  } catch (error: any) {
    console.error('Legacy Refresh Error:', error);
    diagnostics.errorMessage = error.message;
    diagnostics.errorStack = error.stack;
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      diagnostics 
    }, { status: 500 });
  }
}
