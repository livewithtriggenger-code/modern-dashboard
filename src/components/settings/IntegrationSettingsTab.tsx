"use client";
import { useSettings } from "@/hooks/use-settings";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";

export function IntegrationSettingsTab() {
  const { settingsQuery, updateSettings, checkHealth } = useSettings();
  const { data: settings, isLoading } = settingsQuery;
  
  const [formData, setFormData] = useState({
    openai_key: "",
    claude_key: "",
    telegram_bot_token: "",
    calendar_client_id: "",
    calendar_client_secret: "",
    calendar_id: "",
    sheets_client_id: "",
    sheets_client_secret: "",
    sheets_url: ""
  });

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        openai_key: settings.openai_key || "",
        claude_key: settings.claude_key || "",
        telegram_bot_token: settings.telegram_bot_token || "",
        calendar_client_id: settings.calendar_client_id || "",
        calendar_client_secret: settings.calendar_client_secret || "",
        calendar_id: settings.calendar_id || "",
        sheets_client_id: settings.sheets_client_id || "",
        sheets_client_secret: settings.sheets_client_secret || "",
        sheets_url: settings.sheets_url || ""
      });
    }
  }, [settings]);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">AI Models <ShieldCheck className="w-4 h-4 text-green-500" /></CardTitle>
          <CardDescription>Configure your LLM providers. Keys are AES-256 encrypted at rest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>OpenAI API Key</Label>
            <Input type="password" placeholder="sk-..." value={formData.openai_key} onChange={e => setFormData({ ...formData, openai_key: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Anthropic API Key</Label>
            <Input type="password" placeholder="sk-ant-..." value={formData.claude_key} onChange={e => setFormData({ ...formData, claude_key: e.target.value })} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => checkHealth.mutate("AI Providers")}>Test Connection</Button>
          <Button onClick={() => updateSettings.mutate(formData)} disabled={updateSettings.isPending}>Save Keys</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Bot</CardTitle>
          <CardDescription>Connect your Telegram bot to automatically sync inbound leads.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bot Token</Label>
            <Input type="password" value={formData.telegram_bot_token} onChange={e => setFormData({ ...formData, telegram_bot_token: e.target.value })} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => checkHealth.mutate("Telegram")}>Test Webhook</Button>
          <Button onClick={() => updateSettings.mutate({ telegram_bot_token: formData.telegram_bot_token })}>Save Telegram</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Workspace</CardTitle>
          <CardDescription>Configure OAuth credentials for Google Calendar and Sheets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-md">Google Calendar</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input value={formData.calendar_client_id} onChange={e => setFormData({ ...formData, calendar_client_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input type="password" value={formData.calendar_client_secret} onChange={e => setFormData({ ...formData, calendar_client_secret: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <Label>Calendar ID</Label>
              <Input placeholder="primary or specific calendar ID" value={formData.calendar_id} onChange={e => setFormData({ ...formData, calendar_id: e.target.value })} />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-md">Google Sheets</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input value={formData.sheets_client_id} onChange={e => setFormData({ ...formData, sheets_client_id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input type="password" value={formData.sheets_client_secret} onChange={e => setFormData({ ...formData, sheets_client_secret: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <Label>Sheet URL</Label>
              <Input value={formData.sheets_url} onChange={e => setFormData({ ...formData, sheets_url: e.target.value })} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => checkHealth.mutate("Google Workspace")}>Authenticate via OAuth</Button>
          <Button onClick={() => updateSettings.mutate({ 
            calendar_client_id: formData.calendar_client_id,
            calendar_client_secret: formData.calendar_client_secret,
            calendar_id: formData.calendar_id,
            sheets_client_id: formData.sheets_client_id,
            sheets_client_secret: formData.sheets_client_secret,
            sheets_url: formData.sheets_url
          })} disabled={updateSettings.isPending}>Save OAuth Config</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
