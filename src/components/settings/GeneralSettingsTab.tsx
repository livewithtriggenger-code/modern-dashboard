"use client";
import { useSettings } from "@/hooks/use-settings";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { setUserMode } from "@/actions/mode";

import { useRouter } from "next/navigation";

export function GeneralSettingsTab() {
  const { settingsQuery, updateSettings } = useSettings();
  const { data: settings, isLoading } = settingsQuery;
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    business_name: "",
    timezone: "America/New_York",
    working_hours: "",
    active_ai_provider: "openai",
    notification_preferences: {
      ai_escalation: true,
      follow_up: true,
      appointment: true,
      system: true
    }
  });

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        business_name: settings.business_name || "",
        timezone: settings.timezone || "America/New_York",
        working_hours: settings.working_hours || "",
        active_ai_provider: settings.active_ai_provider || "openai",
        notification_preferences: settings.notification_preferences || { ai_escalation: true, follow_up: true, appointment: true, system: true }
      });
    }
  }, [settings]);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Workspace Configuration</CardTitle>
          <CardDescription>Core settings for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={formData.business_name} onChange={e => setFormData({ ...formData, business_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={formData.timezone} onChange={e => setFormData({ ...formData, timezone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Working Hours</Label>
            <Input value={formData.working_hours} onChange={e => setFormData({ ...formData, working_hours: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Active AI Provider</Label>
            <Select value={formData.active_ai_provider} onValueChange={val => setFormData({ ...formData, active_ai_provider: val as string })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude 3.5)</SelectItem>
                <SelectItem value="google">Google (Gemini 1.5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => updateSettings.mutate(formData)} disabled={updateSettings.isPending}>Save Changes</Button>
        </CardFooter>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Control which events trigger system notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>AI Escalations</Label>
              <div className="text-[10px] text-muted-foreground">Notify when AI pauses a thread for human intervention</div>
            </div>
            <Switch checked={formData.notification_preferences.ai_escalation} onCheckedChange={v => setFormData({...formData, notification_preferences: {...formData.notification_preferences, ai_escalation: v}})} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Follow-Up Approvals</Label>
              <div className="text-[10px] text-muted-foreground">Notify when a generated follow-up needs approval</div>
            </div>
            <Switch checked={formData.notification_preferences.follow_up} onCheckedChange={v => setFormData({...formData, notification_preferences: {...formData.notification_preferences, follow_up: v}})} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Appointments</Label>
              <div className="text-[10px] text-muted-foreground">Notify when new appointments are booked</div>
            </div>
            <Switch checked={formData.notification_preferences.appointment} onCheckedChange={v => setFormData({...formData, notification_preferences: {...formData.notification_preferences, appointment: v}})} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>System Alerts</Label>
              <div className="text-[10px] text-muted-foreground">Important updates and billing alerts</div>
            </div>
            <Switch checked={formData.notification_preferences.system} onCheckedChange={v => setFormData({...formData, notification_preferences: {...formData.notification_preferences, system: v}})} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => updateSettings.mutate(formData)} disabled={updateSettings.isPending}>Save Preferences</Button>
        </CardFooter>
      </Card>
      <Card className="mt-6 border-violet-200">
        <CardHeader>
          <CardTitle>Workspace Mode</CardTitle>
          <CardDescription>Switch between the modern NexusAI CRM and your classic Legacy workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">Current Mode: <span className="font-bold text-violet-600">{(settings as any)?.mode === 'legacy' ? 'Legacy (V1)' : 'NexusAI V2'}</span></p>
              <p className="text-sm text-slate-500 mt-1">
                You are currently using the modern V2 dashboard. Switch to Legacy to access your Google Sheets integration.
              </p>
            </div>
            <Button variant="outline" onClick={async () => {
              const res = await setUserMode("legacy");
              if (res?.redirectTo) router.push(res.redirectTo);
            }}>
              Switch to Legacy Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
