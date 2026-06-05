import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Default to nothing here so we can override with mode
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error, data: { session } } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && session) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // 1. Fetch user preferences
      let { data: preferences } = await supabase
        .from("user_preferences")
        .select("mode")
        .eq("user_id", session.user.id)
        .single();

      // 2. Auto-bootstrap if missing
      let isNewUser = false;
      if (!preferences) {
        isNewUser = true;
        const { data: newPrefs } = await supabase
          .from("user_preferences")
          .insert({ user_id: session.user.id, mode: 'v2', legacy_settings: {} })
          .select("mode")
          .single();
        preferences = newPrefs;
      }

      // 3. Route based on mode
      if (preferences) {
        // If it's a completely fresh user, force them through mode selection first
        if (isNewUser) {
          return NextResponse.redirect(`${origin}/select-mode`);
        }

        if (preferences.mode === 'legacy') {
          return NextResponse.redirect(`${origin}/legacy/dashboard`);
        } else if (preferences.mode === 'v2') {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }
      
      return NextResponse.redirect(`${origin}/select-mode`);
    }
  }

  // If something went wrong redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
