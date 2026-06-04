import { SettingsPageClient } from "@/components/settings/SettingsPageClient";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace configuration, API integrations, and AI knowledge.</p>
      </div>
      <SettingsPageClient />
    </div>
  );
}
