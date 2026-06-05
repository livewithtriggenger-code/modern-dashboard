import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getLegacySheetsClient, extractSpreadsheetId } from '@/legacy/providers/google-sheets-provider';

// Hardcoded expected tabs for the legacy CRM, matching V1 exact ranges
const EXPECTED_TABS = [
  { key: 'leads', expectedNames: ['Leads (Master Lead Database)', 'Leads', 'Lead', 'Contacts', 'Sheet1'], range: 'A2:AD' },
  { key: 'conversations', expectedNames: ['Conversation History', 'Conversations', 'Messages', 'Chat', 'Sheet2'], range: 'A2:H' },
  { key: 'appointments', expectedNames: ['Appointments', 'Meetings', 'Calendar', 'Sheet3'], range: 'A2:I' },
  { key: 'memory', expectedNames: ['AI Memory', 'AI_Memory', 'Memory', 'Sheet4'], range: 'A2:D' },
  { key: 'followUps', expectedNames: ['Follow-Up Queue', 'Follow_Ups', 'FollowUps', 'Follow Ups', 'Tasks', 'Sheet5'], range: 'A2:I' },
  { key: 'knowledge', expectedNames: ['Business_Knowledge', 'Knowledge', 'Business Knowledge', 'Settings', 'Sheet6'], range: 'A2:H' }
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

    // 7. Data Mapping exactly replicating V1
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
          id: row[0] || "",
          conversationId: row[1] || "",
          fullName: row[2] || "",
          email: row[3] || "",
          phone: row[4] || "",
          source: row[5] || "",
          businessType: row[8] || "",
          status: row[9] || "new",
          leadScore: parseInt(row[10]) || 0,
          intent: row[11] || "low",
          urgency: row[12] || "low",
          createdDate: row[17] || new Date().toISOString(),
          lastContactTime: row[18] || new Date().toISOString(),
          bookedCall: row[22] === "TRUE",
          reminderSent: row[28] === "TRUE",
          notes: row[29] || "",
        }));
      } else if (key === 'conversations') {
        result.conversations = rows.map((row, i) => ({
          row: i + 2,
          id: row[0] || "",
          leadId: row[1] || "",
          sender: row[2] || "",
          message: row[3] || "",
          channel: row[4] || "",
          messageType: row[5] || "",
          timestamp: row[6] || new Date().toISOString(),
        }));
      } else if (key === 'appointments') {
        result.appointments = rows.map((row, i) => ({
          row: i + 2,
          id: row[0] || "",
          leadId: row[1] || "",
          leadName: "", 
          meetingLink: row[2] || "",
          appointmentDate: row[3] || "",
          appointmentTime: row[4] || "",
          appointmentStart: row[5] || "",
          appointmentEnd: row[6] || "",
          status: row[7] || "scheduled",
          reminderSent: row[8] === "TRUE",
        }));
      } else if (key === 'memory') {
        result.memory = rows.map((row, i) => ({
          row: i + 2,
          id: `mem_${i}_${row[0]}_${row[1]}`, 
          leadId: row[0] || "",
          leadName: "", 
          memoryType: row[1] || "context",
          memoryValue: row[2] || "",
          lastUpdated: row[3] || new Date().toISOString(),
        }));
      } else if (key === 'followUps') {
        result.followUps = rows.map((row, i) => ({
          row: i + 2,
          id: row[0] || "",
          leadId: row[1] || "",
          leadName: row[2] || "",
          followUpNumber: parseInt(row[3]) || 1,
          followUpMessage: row[4] || "",
          scheduledTime: row[5] || new Date().toISOString(),
          status: row[6] || "pending",
          messageSent: row[7] === "TRUE",
          responseReceived: row[8] === "TRUE",
        }));
      } else if (key === 'knowledge') {
        result.knowledge = rows.map((row, i) => ({
          row: i + 2,
          id: row[0] || "",
          businessName: row[1] || "",
          services: row[2] ? row[2].split(",").map((s: string) => s.trim()) : [],
          pricing: row[3] || "",
          faqs: row[4] ? JSON.parse(row[4]) : [],
          hours: row[5] || "",
          policies: row[6] || "",
          bookingLink: row[7] || "",
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
