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

      // Check mode for default redirect
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (membership) {
        const { data: settings } = await supabase
          .from("workspace_settings")
          .select("mode")
          .eq("workspace_id", membership.workspace_id)
          .single();

        if (settings) {
          if (settings.mode === 'legacy') {
            return NextResponse.redirect(`${origin}/legacy/dashboard`);
          } else if (settings.mode === 'v2') {
            return NextResponse.redirect(`${origin}/dashboard`);
          }
        }
      }
      
      // If no mode is explicitly set or no workspace yet
      return NextResponse.redirect(`${origin}/select-mode`);
    }
  }

  // If something went wrong redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
