"use client";

import { useEffect, useState } from "react";
import { LegacyHealthCheck } from "@/legacy/components/settings/LegacyHealthCheck";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveLegacySettings, getLegacySettings } from "@/actions/legacy-settings";
import { Loader2 } from "lucide-react";
import { useLegacyStore } from "@/legacy/store/legacy-store";

export default function LegacySettingsPage() {
  const [loading, setLoading] = useState(false);
  const { refreshData } = useLegacyStore();
  const [formData, setFormData] = useState({
    sheets_url: "",
    sheets_client_email: "",
    sheets_private_key: "",
    telegram_bot_token: ""
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getLegacySettings();
        setFormData({
          sheets_url: settings.sheets_url || "",
          sheets_client_email: settings.sheets_client_email || "",
          sheets_private_key: settings.sheets_private_key || "",
          telegram_bot_token: settings.telegram_bot_token || ""
        });
      } catch (err) {
        console.error("Failed to load legacy settings", err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await saveLegacySettings(formData);
      // Try to fetch new data
      await refreshData();
      alert("Settings saved successfully!");
    } catch (e: any) {
      alert("Failed to save settings: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Legacy Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your Google Sheets and Telegram integration.</p>
      </div>

      <LegacyHealthCheck />

      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Connection</CardTitle>
          <CardDescription>
            Enter your Google Service Account credentials to allow NexusAI to read and write to your CRM sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Sheets URL</Label>
            <Input 
              placeholder="https://docs.google.com/spreadsheets/d/..." 
              value={formData.sheets_url}
              onChange={e => setFormData({ ...formData, sheets_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Service Account Email</Label>
            <Input 
              placeholder="nexusai-crm@project-id.iam.gserviceaccount.com" 
              value={formData.sheets_client_email}
              onChange={e => setFormData({ ...formData, sheets_client_email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Private Key</Label>
            <Textarea 
              placeholder="-----BEGIN PRIVATE KEY-----\n..." 
              className="font-mono text-xs"
              rows={5}
              value={formData.sheets_private_key}
              onChange={e => setFormData({ ...formData, sheets_private_key: e.target.value })}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save & Test Connection
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Bot</CardTitle>
          <CardDescription>
            Configure your Telegram bot for sending direct messages to leads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bot Token</Label>
            <Input 
              placeholder="1234567890:AAH_..." 
              type="password"
              value={formData.telegram_bot_token}
              onChange={e => setFormData({ ...formData, telegram_bot_token: e.target.value })}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={loading} variant="outline">
            Save Telegram Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
