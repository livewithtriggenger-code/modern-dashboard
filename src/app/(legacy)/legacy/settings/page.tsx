"use client";

import { useEffect, useState } from "react";
import { LegacyHealthCheck } from "@/legacy/components/settings/LegacyHealthCheck";
import { saveLegacySettings, getLegacySettings } from "@/actions/legacy-settings";
import { 
  testLegacySheets, 
  testTelegramBot, 
  testOpenAI, 
  testGemini, 
  testClaude, 
  testGrok 
} from "@/actions/legacy-validation";
import { 
  Database, 
  Send, 
  Cpu, 
  CheckCircle2, 
  XCircle,
  Loader2
} from "lucide-react";
import { useLegacyStore } from "@/legacy/store/legacy-store";
import { cn } from "@/lib/utils";

import { LegacyCard } from "@/legacy/components/ui/LegacyCard";
import { LegacyBadge, LegacyBadgeStatus } from "@/legacy/components/ui/LegacyBadge";
import { LegacyButton } from "@/legacy/components/ui/LegacyButton";
import { LegacyInput } from "@/legacy/components/ui/LegacyInput";

export default function LegacySettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const { refreshData } = useLegacyStore();
  
  const [formData, setFormData] = useState({
    sheets_url: "",
    sheets_client_email: "",
    sheets_private_key: "",
    telegram_bot_token: "",
    telegram_webhook_url: "",
    openai_key: "",
    gemini_key: "",
    claude_key: "",
    grok_key: ""
  });

  const [status, setStatus] = useState<Record<string, LegacyBadgeStatus>>({
    sheets: 'not_connected',
    telegram: 'not_connected',
    openai: 'not_connected',
    gemini: 'not_connected',
    claude: 'not_connected',
    grok: 'not_connected'
  });

  const [testMessages, setTestMessages] = useState<Record<string, { success: boolean; text: string }>>({});

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getLegacySettings();
        setFormData({
          sheets_url: settings.sheets_url || "",
          sheets_client_email: settings.sheets_client_email || "",
          sheets_private_key: settings.sheets_private_key || "",
          telegram_bot_token: settings.telegram_bot_token || "",
          telegram_webhook_url: settings.telegram_webhook_url || "",
          openai_key: settings.openai_key || "",
          gemini_key: settings.gemini_key || "",
          claude_key: settings.claude_key || "",
          grok_key: settings.grok_key || ""
        });

        setStatus({
          sheets: (settings.sheets_url && settings.sheets_client_email) ? 'connected' : 'not_connected',
          telegram: settings.telegram_bot_token ? 'connected' : 'not_connected',
          openai: settings.openai_key ? 'connected' : 'not_connected',
          gemini: settings.gemini_key ? 'connected' : 'not_connected',
          claude: settings.claude_key ? 'connected' : 'not_connected',
          grok: settings.grok_key ? 'connected' : 'not_connected'
        });
        setMounted(true);
      } catch (err) {
        console.error("Failed to load legacy settings", err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (id: string) => {
    try {
      setSavingId(id);
      await saveLegacySettings(formData);
      
      const updateStatus = { ...status };
      if (id === 'sheets') updateStatus.sheets = 'connected';
      if (id === 'telegram') updateStatus.telegram = 'connected';
      if (id === 'openai') updateStatus.openai = 'connected';
      if (id === 'gemini') updateStatus.gemini = 'connected';
      if (id === 'claude') updateStatus.claude = 'connected';
      if (id === 'grok') updateStatus.grok = 'connected';
      setStatus(updateStatus);
      
      await refreshData();
    } catch (e: any) {
      alert("Failed to save settings: " + e.message);
    } finally {
      setSavingId(null);
    }
  };

  const runTest = async (id: string, testFn: () => Promise<{ success: boolean; message: string }>) => {
    setTestingId(id);
    setStatus(prev => ({ ...prev, [id]: 'testing' }));
    setTestMessages(prev => { const n = { ...prev }; delete n[id]; return n; });
    
    try {
      const res = await testFn();
      setTestMessages(prev => ({ ...prev, [id]: { success: res.success, text: res.message } }));
      setStatus(prev => ({ ...prev, [id]: res.success ? 'connected' : 'error' }));
    } catch (err: any) {
      setTestMessages(prev => ({ ...prev, [id]: { success: false, text: "Network Error" } }));
      setStatus(prev => ({ ...prev, [id]: 'error' }));
    } finally {
      setTestingId(null);
    }
  };

  const renderMessage = (id: string) => {
    const msg = testMessages[id];
    if (!msg) return null;
    return (
      <div className={cn(
        'mt-6 flex items-start gap-3 p-4 rounded-xl text-[13px] font-semibold leading-relaxed shadow-sm transition-all duration-300',
        msg.success
          ? 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-400'
          : 'bg-rose-950/40 border border-rose-900/50 text-rose-400'
      )}>
        {msg.success
          ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          : <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
        }
        <span>{msg.text}</span>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] w-full gap-5 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-[13px] font-bold tracking-widest uppercase">Initializing Legacy Workspace...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24">
      
      <div className="max-w-[880px] mx-auto space-y-10 pt-10 px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-10 pb-8 border-b border-slate-800/60">
          <h1 className="text-[32px] font-black tracking-tight text-white leading-tight">Legacy Settings</h1>
          <p className="text-[15px] text-slate-400 mt-2 font-medium">Configure your core Workspace integrations, Database sync, and AI parameters.</p>
        </div>

        <LegacyHealthCheck />

        {/* --- Google Sheets --- */}
        <LegacyCard>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[16px] bg-emerald-950/50 border border-emerald-900/50 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(16,185,129,0.2)]">
                <Database className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-[17px] font-black text-white tracking-tight">Google Sheets Database</h4>
                <p className="text-[13px] text-slate-400 font-medium mt-1">Primary CRM database configuration.</p>
              </div>
            </div>
            <LegacyBadge status={status.sheets} />
          </div>
          
          <div className="space-y-6 mb-8">
            <LegacyInput 
              label="Spreadsheet URL"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={formData.sheets_url}
              onChange={e => setFormData({ ...formData, sheets_url: e.target.value })}
            />
            <LegacyInput 
              label="Service Account Email"
              placeholder="nexusai-crm@project-id.iam.gserviceaccount.com"
              value={formData.sheets_client_email}
              onChange={e => setFormData({ ...formData, sheets_client_email: e.target.value })}
            />
            <LegacyInput 
              label="Private Key"
              placeholder="-----BEGIN PRIVATE KEY-----\n..."
              isSecret
              multiline
              value={formData.sheets_private_key}
              onChange={e => setFormData({ ...formData, sheets_private_key: e.target.value })}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-700/50">
            <LegacyButton
              variant="secondary"
              onClick={() => runTest('sheets', () => testLegacySheets(formData.sheets_url, formData.sheets_client_email, formData.sheets_private_key))}
              loading={testingId === 'sheets'}
              loadingText="Testing..."
              className="w-full sm:flex-1"
            >
              Test Connection
            </LegacyButton>
            <LegacyButton 
              variant="primary"
              onClick={() => handleSave('sheets')} 
              loading={savingId === 'sheets'} 
              loadingText="Saving..."
              className="w-full sm:flex-1"
            >
              Save Credentials
            </LegacyButton>
          </div>
          {renderMessage('sheets')}
        </LegacyCard>

        {/* --- Telegram Bot --- */}
        <LegacyCard>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[16px] bg-sky-950/50 border border-sky-900/50 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(14,165,233,0.2)]">
                <Send className="h-6 w-6 text-sky-400 -ml-0.5" />
              </div>
              <div>
                <h4 className="text-[17px] font-black text-white tracking-tight">Telegram Bot</h4>
                <p className="text-[13px] text-slate-400 font-medium mt-1">Lead engagement and notifications.</p>
              </div>
            </div>
            <LegacyBadge status={status.telegram} />
          </div>
          
          <div className="space-y-6 mb-8">
            <LegacyInput 
              label="Bot Token"
              placeholder="123456789:ABCdefGHIjkl..."
              isSecret
              value={formData.telegram_bot_token}
              onChange={e => setFormData({ ...formData, telegram_bot_token: e.target.value })}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-700/50">
            <LegacyButton
              variant="secondary"
              onClick={() => runTest('telegram', () => testTelegramBot(formData.telegram_bot_token))}
              loading={testingId === 'telegram'}
              loadingText="Testing..."
              className="w-full sm:flex-1"
            >
              Validate Token
            </LegacyButton>
            <LegacyButton 
              variant="primary"
              onClick={() => handleSave('telegram')} 
              loading={savingId === 'telegram'} 
              loadingText="Saving..."
              className="w-full sm:flex-1"
            >
              Save Credentials
            </LegacyButton>
          </div>
          {renderMessage('telegram')}
        </LegacyCard>

        {/* --- AI Providers --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* OpenAI */}
          <LegacyCard className="p-6 lg:p-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.05)]">
                  <Cpu className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-[16px] font-black text-white tracking-tight">OpenAI</h4>
                </div>
              </div>
              <LegacyBadge status={status.openai} />
            </div>
            
            <div className="space-y-6 mb-8">
              <LegacyInput 
                label="API Key"
                placeholder="sk-..."
                isSecret
                value={formData.openai_key}
                onChange={e => setFormData({ ...formData, openai_key: e.target.value })}
              />
            </div>
            
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-700/50">
              <LegacyButton 
                variant="secondary" 
                onClick={() => runTest('openai', () => testOpenAI(formData.openai_key))} 
                loading={testingId === 'openai'} 
                loadingText="Testing..."
                className="w-full"
              >
                Validate Key
              </LegacyButton>
              <LegacyButton 
                variant="primary" 
                onClick={() => handleSave('openai')} 
                loading={savingId === 'openai'} 
                loadingText="Saving..."
                className="w-full"
              >
                Save API Key
              </LegacyButton>
            </div>
            {renderMessage('openai')}
          </LegacyCard>

          {/* Gemini */}
          <LegacyCard className="p-6 lg:p-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-blue-950/50 border border-blue-900/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                  <Cpu className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-[16px] font-black text-white tracking-tight">Google Gemini</h4>
                </div>
              </div>
              <LegacyBadge status={status.gemini} />
            </div>
            
            <div className="space-y-6 mb-8">
              <LegacyInput 
                label="API Key"
                placeholder="AIzaSy..."
                isSecret
                value={formData.gemini_key}
                onChange={e => setFormData({ ...formData, gemini_key: e.target.value })}
              />
            </div>
            
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-700/50">
              <LegacyButton 
                variant="secondary" 
                onClick={() => runTest('gemini', () => testGemini(formData.gemini_key))} 
                loading={testingId === 'gemini'} 
                loadingText="Testing..."
                className="w-full"
              >
                Validate Key
              </LegacyButton>
              <LegacyButton 
                variant="primary" 
                onClick={() => handleSave('gemini')} 
                loading={savingId === 'gemini'} 
                loadingText="Saving..."
                className="w-full"
              >
                Save API Key
              </LegacyButton>
            </div>
            {renderMessage('gemini')}
          </LegacyCard>

          {/* Claude */}
          <LegacyCard className="p-6 lg:p-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-orange-950/50 border border-orange-900/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(249,115,22,0.2)]">
                  <Cpu className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-[16px] font-black text-white tracking-tight">Anthropic Claude</h4>
                </div>
              </div>
              <LegacyBadge status={status.claude} />
            </div>
            
            <div className="space-y-6 mb-8">
              <LegacyInput 
                label="API Key"
                placeholder="sk-ant-..."
                isSecret
                value={formData.claude_key}
                onChange={e => setFormData({ ...formData, claude_key: e.target.value })}
              />
            </div>
            
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-700/50">
              <LegacyButton 
                variant="secondary" 
                onClick={() => runTest('claude', () => testClaude(formData.claude_key))} 
                loading={testingId === 'claude'} 
                loadingText="Testing..."
                className="w-full"
              >
                Validate Key
              </LegacyButton>
              <LegacyButton 
                variant="primary" 
                onClick={() => handleSave('claude')} 
                loading={savingId === 'claude'} 
                loadingText="Saving..."
                className="w-full"
              >
                Save API Key
              </LegacyButton>
            </div>
            {renderMessage('claude')}
          </LegacyCard>

          {/* Grok */}
          <LegacyCard className="p-6 lg:p-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-md">
                  <span className="text-white font-black text-[20px] leading-none">X</span>
                </div>
                <div>
                  <h4 className="text-[16px] font-black text-white tracking-tight">Grok AI</h4>
                </div>
              </div>
              <LegacyBadge status={status.grok} />
            </div>
            
            <div className="space-y-6 mb-8">
              <LegacyInput 
                label="API Key"
                placeholder="xai-..."
                isSecret
                value={formData.grok_key}
                onChange={e => setFormData({ ...formData, grok_key: e.target.value })}
              />
            </div>
            
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-700/50">
              <LegacyButton 
                variant="secondary" 
                onClick={() => runTest('grok', () => testGrok(formData.grok_key))} 
                loading={testingId === 'grok'} 
                loadingText="Testing..."
                className="w-full"
              >
                Validate Key
              </LegacyButton>
              <LegacyButton 
                variant="primary" 
                onClick={() => handleSave('grok')} 
                loading={savingId === 'grok'} 
                loadingText="Saving..."
                className="w-full"
              >
                Save API Key
              </LegacyButton>
            </div>
            {renderMessage('grok')}
          </LegacyCard>

        </div>

      </div>
    </div>
  );
}
