"use server";

import { google } from "googleapis";

// Helper: Extract spreadsheet ID from a Google Sheets URL
function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]+$/.test(url.trim())) return url.trim();
  return null;
}

export async function testLegacySheets(spreadsheetUrl: string, clientEmail: string, privateKey: string) {
  if (!spreadsheetUrl) {
    return { success: false, message: "Invalid Sheet URL" };
  }
  if (!clientEmail) {
    return { success: false, message: "Invalid service account email" };
  }
  if (!privateKey) {
    return { success: false, message: "Invalid private key" };
  }

  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
  if (!spreadsheetId) {
    return { success: false, message: "Invalid Sheet URL" };
  }

  try {
    const authClient = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        client_email: clientEmail.trim(),
        private_key: privateKey.trim().replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth: authClient });
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "spreadsheetId,properties.title",
    });

    return { 
      success: true, 
      message: `Successfully connected to "${response.data.properties?.title}".` 
    };

  } catch (error: any) {
    const status = error?.status || error?.code;
    const errMsg = error?.message || "";

    if (status === 403 || errMsg.includes("PERMISSION_DENIED")) {
      return { success: false, message: "Sheet not shared with service account" };
    }
    if (status === 404 || errMsg.includes("NOT_FOUND")) {
      return { success: false, message: "Sheet not found" };
    }
    if (status === 401 || errMsg.includes("UNAUTHENTICATED") || errMsg.includes("invalid_grant")) {
      return { success: false, message: "Authentication failed" };
    }
    if (errMsg.includes("private key")) {
      return { success: false, message: "Invalid private key" };
    }
    if (errMsg.includes("client_email")) {
      return { success: false, message: "Invalid service account" };
    }

    return { success: false, message: "Connection failed: " + errMsg };
  }
}

export async function testTelegramBot(token: string) {
  if (!token) return { success: false, message: "Token is required" };
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    if (data.ok && data.result) {
      return { success: true, message: `Connected: @${data.result.username} (ID: ${data.result.id})` };
    }
    return { success: false, message: data.description || "Invalid Telegram Token" };
  } catch (err: any) {
    return { success: false, message: "Network error calling Telegram API" };
  }
}

export async function testOpenAI(apiKey: string) {
  if (!apiKey) return { success: false, message: "API Key is required" };
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) return { success: true, message: "OpenAI connection successful" };
    const data = await response.json();
    return { success: false, message: data.error?.message || "Invalid OpenAI Key" };
  } catch (err) {
    return { success: false, message: "Network error calling OpenAI API" };
  }
}

export async function testGemini(apiKey: string) {
  if (!apiKey) return { success: false, message: "API Key is required" };
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (response.ok) return { success: true, message: "Gemini connection successful" };
    const data = await response.json();
    return { success: false, message: data.error?.message || "Invalid Gemini Key" };
  } catch (err) {
    return { success: false, message: "Network error calling Gemini API" };
  }
}

export async function testClaude(apiKey: string) {
  if (!apiKey) return { success: false, message: "API Key is required" };
  try {
    // Claude uses a slightly different auth validation, hitting the models endpoint is safest
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: { 
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
    });
    if (response.ok) return { success: true, message: "Claude connection successful" };
    const data = await response.json();
    return { success: false, message: data.error?.message || "Invalid Claude Key" };
  } catch (err) {
    return { success: false, message: "Network error calling Claude API" };
  }
}

export async function testGrok(apiKey: string) {
  if (!apiKey) return { success: false, message: "API Key is required" };
  try {
    const response = await fetch("https://api.x.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) return { success: true, message: "Grok connection successful" };
    const data = await response.json();
    return { success: false, message: data.error?.message || "Invalid Grok Key" };
  } catch (err) {
    return { success: false, message: "Network error calling Grok API" };
  }
}
