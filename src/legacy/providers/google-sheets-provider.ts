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

  // Bulletproof PEM formatter to fix 'DECODER routines::unsupported'
  let formattedPrivateKey = private_key;
  
  // Attempt to extract the inner base64 payload
  const keyMatch = formattedPrivateKey.match(/-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----/s);
  
  if (keyMatch) {
    // Extract base64, remove all whitespace, newlines, and escape chars
    const cleanBase64 = keyMatch[1].replace(/[\r\n\s\\]+/g, '');
    // Chunk into 64-character lines (PEM standard requirement)
    const chunks = cleanBase64.match(/.{1,64}/g) || [];
    formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
  } else {
    // Fallback if regex fails (shouldn't happen for valid keys)
    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n').replace(/"/g, '').trim();
  }

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
