import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export async function createGoogleCalendarEvent(workspaceId: string, payload: any) {
  const supabase = await createClient();
  
  // 1. Fetch workspace Google OAuth credentials
  const { data } = await supabase
    .from("workspace_settings")
    .select("google_access_token, google_refresh_token")
    .eq("workspace_id", workspaceId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = data as any;

  if (!settings?.google_access_token) {
    // Return mock values if no OAuth is setup yet (Foundation mode)
    return {
      google_event_id: `gcal_${Math.random().toString(36).substring(7)}`,
      meeting_link: `https://meet.google.com/${Math.random().toString(36).substring(7)}`
    };
  }

  // 2. Ideally: Construct Google Calendar API payload using googleapis package
  // const oauth2Client = new google.auth.OAuth2(...);
  // oauth2Client.setCredentials({ access_token: settings.google_access_token });
  // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  // const event = await calendar.events.insert({ ... })

  return {
    google_event_id: `gcal_production_${Date.now()}`,
    meeting_link: `https://meet.google.com/prod`
  };
}
