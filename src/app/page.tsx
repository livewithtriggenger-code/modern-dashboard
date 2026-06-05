import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user preferences
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("mode")
    .eq("user_id", user.id)
    .single();

  if (preferences) {
    if (preferences.mode === "legacy") {
      redirect("/legacy/dashboard");
    } else if (preferences.mode === "v2") {
      redirect("/dashboard");
    }
  } else {
    redirect("/select-mode");
  }

  redirect("/dashboard");
}
