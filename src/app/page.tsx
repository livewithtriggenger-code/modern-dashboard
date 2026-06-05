import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's primary workspace mode
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (membership) {
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("mode")
      .eq("workspace_id", membership.workspace_id)
      .single();

    if (settings?.mode === "legacy") {
      redirect("/legacy/dashboard");
    }
  }

  redirect("/dashboard");
}
