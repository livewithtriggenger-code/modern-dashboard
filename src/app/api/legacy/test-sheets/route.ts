import { NextResponse } from 'next/server';
import { getLegacySheetsClient, extractSpreadsheetId } from '@/legacy/providers/google-sheets-provider';

export async function POST(request: Request) {
  try {
    const legacySettings = await request.json();

    if (!legacySettings.sheets_url) {
      return NextResponse.json({ success: false, error: 'Google Sheets URL is required' }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(legacySettings.sheets_url);
    if (!spreadsheetId) {
      return NextResponse.json({ success: false, error: 'Invalid Google Sheets URL format' }, { status: 400 });
    }

    const sheets = await getLegacySheetsClient(legacySettings);

    // Try to fetch spreadsheet metadata to verify access
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
    });

    if (response.data) {
      const sheetsTitles = response.data.sheets?.map(s => s.properties?.title) || [];
      const requiredSheets = ['Leads', 'Conversations', 'Appointments', 'AI_Memory', 'Follow_Ups', 'Business_Knowledge'];
      
      const missingSheets = requiredSheets.filter(sheet => !sheetsTitles.includes(sheet));

      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Google Sheets',
        spreadsheetTitle: response.data.properties?.title,
        missingSheets: missingSheets.length > 0 ? missingSheets : undefined
      });
    }

    return NextResponse.json({ success: false, error: 'Could not access spreadsheet data' }, { status: 400 });

  } catch (error: any) {
    console.error('Test Sheets Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to authenticate with Google Sheets' }, { status: 500 });
  }
}
