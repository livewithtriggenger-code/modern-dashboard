import { google } from "googleapis";

export async function getLegacySheetsClient(legacySettings: any) {
  if (!legacySettings) {
    throw new Error("No legacy settings found");
  }

  const client_email = legacySettings.sheets_client_email;
  const private_key = legacySettings.sheets_private_key;

  if (!client_email || !private_key) {
    throw new Error("Google Sheets credentials not configured in Legacy Settings");
  }

  // Handle both escaped and unescaped newlines in private key
  const formattedPrivateKey = private_key.replace(/\\n/g, "\n");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: client_email,
      private_key: formattedPrivateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export function extractSpreadsheetId(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
