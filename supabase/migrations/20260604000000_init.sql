-- NexusAI CRM V2 Initial Migration
-- Creates all tables, relationships, RPC functions, and Row Level Security policies.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Type Definitions
CREATE TYPE role_type AS ENUM ('owner', 'admin', 'member');
CREATE TYPE intent_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'contacted', 'converted', 'lost');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE thread_status AS ENUM ('active', 'paused', 'closed');
CREATE TYPE sender_type AS ENUM ('human_operator', 'ai_agent', 'lead');
CREATE TYPE creator_type AS ENUM ('human', 'ai');
CREATE TYPE memory_type AS ENUM ('preference', 'behavior', 'context', 'intent', 'objection', 'timeline', 'budget');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show');
CREATE TYPE follow_up_status AS ENUM ('pending', 'sent', 'failed', 'paused');
CREATE TYPE notification_type AS ENUM ('ai_escalation', 'follow_up', 'appointment', 'system');

-- Base Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tables

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role role_type NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE workspace_settings (
    workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    business_name TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    working_hours TEXT,
    active_ai_provider TEXT DEFAULT 'openai',
    grok_key TEXT,
    openai_key TEXT,
    gemini_key TEXT,
    claude_key TEXT,
    telegram_bot_token TEXT,
    telegram_webhook_url TEXT,
    telegram_connected BOOLEAN DEFAULT false,
    calendar_client_id TEXT,
    calendar_client_secret TEXT,
    calendar_id TEXT,
    calendar_connected BOOLEAN DEFAULT false,
    sheets_client_id TEXT,
    sheets_client_secret TEXT,
    sheets_url TEXT,
    sheets_connected BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{"ai_escalation": true, "follow_up": true, "appointment": true, "system": true}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT,
    business_type TEXT,
    lead_score NUMERIC DEFAULT 0,
    intent intent_level DEFAULT 'low',
    urgency urgency_level DEFAULT 'low',
    status lead_status DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lead_intelligence (
    lead_id UUID PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    qualification TEXT,
    priority priority_level DEFAULT 'low',
    health_score NUMERIC DEFAULT 0,
    opportunity TEXT,
    recommended_action TEXT,
    last_generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    status thread_status DEFAULT 'active',
    ai_mode TEXT DEFAULT 'auto',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES conversation_threads(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    sender_type sender_type NOT NULL,
    message_body TEXT NOT NULL,
    channel TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    source_message_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    created_by creator_type DEFAULT 'ai',
    confidence_score NUMERIC DEFAULT 0,
    memory_type memory_type,
    memory_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    appointment_start TIMESTAMPTZ NOT NULL,
    appointment_end TIMESTAMPTZ NOT NULL,
    meeting_link TEXT,
    status appointment_status DEFAULT 'scheduled',
    google_event_id TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ NOT NULL,
    message_payload TEXT,
    status follow_up_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE business_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_workspace_settings_updated_at BEFORE UPDATE ON workspace_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_conversation_threads_updated_at BEFORE UPDATE ON conversation_threads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ai_memories_updated_at BEFORE UPDATE ON ai_memories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON follow_ups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_business_knowledge_updated_at BEFORE UPDATE ON business_knowledge FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Analytics RPC Functions

CREATE OR REPLACE FUNCTION get_kpi_metrics(p_workspace_id UUID, p_start_date TIMESTAMPTZ)
RETURNS JSONB AS $$
DECLARE
    v_total_leads INT;
    v_active_threads INT;
    v_converted_leads INT;
    v_conversion_rate NUMERIC;
    v_pending_follow_ups INT;
BEGIN
    SELECT count(*) INTO v_total_leads FROM leads WHERE workspace_id = p_workspace_id AND created_at >= p_start_date;
    SELECT count(*) INTO v_converted_leads FROM leads WHERE workspace_id = p_workspace_id AND status = 'converted' AND created_at >= p_start_date;
    SELECT count(*) INTO v_active_threads FROM conversation_threads WHERE workspace_id = p_workspace_id AND status = 'active' AND created_at >= p_start_date;
    SELECT count(*) INTO v_pending_follow_ups FROM follow_ups WHERE workspace_id = p_workspace_id AND status = 'pending' AND created_at >= p_start_date;

    IF v_total_leads > 0 THEN
        v_conversion_rate := (v_converted_leads::NUMERIC / v_total_leads::NUMERIC) * 100;
    ELSE
        v_conversion_rate := 0;
    END IF;

    RETURN json_build_object(
        'totalLeads', v_total_leads,
        'activeConversations', v_active_threads,
        'conversionRate', v_conversion_rate,
        'pendingFollowUps', v_pending_follow_ups
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_funnel_stats(p_workspace_id UUID, p_start_date TIMESTAMPTZ)
RETURNS JSONB AS $$
DECLARE
    v_new INT;
    v_contacted INT;
    v_qualified INT;
    v_converted INT;
BEGIN
    SELECT count(*) INTO v_new FROM leads WHERE workspace_id = p_workspace_id AND status = 'new' AND created_at >= p_start_date;
    SELECT count(*) INTO v_contacted FROM leads WHERE workspace_id = p_workspace_id AND status = 'contacted' AND created_at >= p_start_date;
    SELECT count(*) INTO v_qualified FROM leads WHERE workspace_id = p_workspace_id AND status = 'qualified' AND created_at >= p_start_date;
    SELECT count(*) INTO v_converted FROM leads WHERE workspace_id = p_workspace_id AND status = 'converted' AND created_at >= p_start_date;

    RETURN json_build_array(
        json_build_object('stage', 'New', 'count', v_new),
        json_build_object('stage', 'Contacted', 'count', v_contacted),
        json_build_object('stage', 'Qualified', 'count', v_qualified),
        json_build_object('stage', 'Converted', 'count', v_converted)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS)

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Base Policy Template: Users can only see data if they are a member of the workspace.
CREATE POLICY "Users can view workspaces they belong to" ON workspaces FOR SELECT USING (id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can access workspace_settings" ON workspace_settings FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access leads" ON leads FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access lead_intelligence" ON lead_intelligence FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access conversation_threads" ON conversation_threads FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access conversations" ON conversations FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access ai_memories" ON ai_memories FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access appointments" ON appointments FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access follow_ups" ON follow_ups FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access business_knowledge" ON business_knowledge FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access audit_logs" ON audit_logs FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can access notifications" ON notifications FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));
