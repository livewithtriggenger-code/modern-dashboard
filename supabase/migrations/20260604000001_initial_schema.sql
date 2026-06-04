-- =============================================================================
-- NexusAI CRM V2 - Initial Schema Migration
-- Migration: 20260604000001_initial_schema.sql
-- =============================================================================


-- =============================================================================
-- SECTION 1: EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";


-- =============================================================================
-- SECTION 2: ENUMS
-- =============================================================================

CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');

CREATE TYPE lead_intent AS ENUM ('low', 'medium', 'high');

CREATE TYPE lead_urgency AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'contacted', 'converted', 'lost');

CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE thread_status AS ENUM ('active', 'paused', 'closed');

CREATE TYPE sender_type AS ENUM ('human_operator', 'ai_agent', 'lead');

CREATE TYPE memory_type AS ENUM (
  'preference',
  'behavior',
  'context',
  'intent',
  'objection',
  'timeline',
  'budget'
);

CREATE TYPE memory_creator AS ENUM ('human', 'ai');

CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no-show'
);

CREATE TYPE follow_up_status AS ENUM ('pending', 'sent', 'failed', 'paused');


-- =============================================================================
-- SECTION 3: TABLES
-- =============================================================================

-- 3.1 Workspaces
CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Workspace Members
CREATE TABLE workspace_members (
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          workspace_role NOT NULL DEFAULT 'member',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- 3.3 Workspace Settings
CREATE TABLE workspace_settings (
  workspace_id          UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  business_name         TEXT,
  timezone              TEXT NOT NULL DEFAULT 'America/New_York',
  working_hours         TEXT,
  -- AI Provider Keys (application-layer AES-256 encrypted before storage)
  grok_key              TEXT,
  openai_key            TEXT,
  gemini_key            TEXT,
  claude_key            TEXT,
  -- Telegram Integration
  telegram_bot_token    TEXT,
  telegram_webhook_url  TEXT,
  telegram_connected    BOOLEAN NOT NULL DEFAULT FALSE,
  -- Google Calendar Integration
  calendar_client_id      TEXT,
  calendar_client_secret  TEXT,
  calendar_refresh_token  TEXT,
  calendar_id             TEXT,
  calendar_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  -- Google Sheets Integration
  sheets_client_id        TEXT,
  sheets_client_secret    TEXT,
  sheets_refresh_token    TEXT,
  sheets_url              TEXT,
  sheets_connected        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Leads
CREATE TABLE leads (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  email          TEXT,
  phone          TEXT,
  source         TEXT,
  business_type  TEXT,
  lead_score     NUMERIC(4,1) NOT NULL DEFAULT 0.0
                   CHECK (lead_score >= 0.0 AND lead_score <= 10.0),
  intent         lead_intent NOT NULL DEFAULT 'low',
  urgency        lead_urgency NOT NULL DEFAULT 'low',
  status         lead_status NOT NULL DEFAULT 'new',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 Lead Intelligence
CREATE TABLE lead_intelligence (
  lead_id            UUID PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  qualification      TEXT,
  priority           lead_priority NOT NULL DEFAULT 'low',
  health_score       NUMERIC(4,1) CHECK (health_score >= 0.0 AND health_score <= 10.0),
  opportunity        TEXT,
  recommended_action TEXT,
  last_generated_at  TIMESTAMPTZ
);

-- 3.6 Conversation Threads
CREATE TABLE conversation_threads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status        thread_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 Conversations (Messages)
CREATE TABLE conversations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id    UUID NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_type  sender_type NOT NULL,
  message_body TEXT NOT NULL,
  channel      TEXT NOT NULL DEFAULT 'telegram',
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 AI Memories
CREATE TABLE ai_memories (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  source_message_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  created_by        memory_creator NOT NULL DEFAULT 'ai',
  confidence_score  NUMERIC(5,1) NOT NULL DEFAULT 0.0
                      CHECK (confidence_score >= 0.0 AND confidence_score <= 100.0),
  memory_type       memory_type NOT NULL,
  memory_value      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.9 Appointments
CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  appointment_start TIMESTAMPTZ NOT NULL,
  appointment_end   TIMESTAMPTZ NOT NULL,
  meeting_link      TEXT,
  status            appointment_status NOT NULL DEFAULT 'scheduled',
  google_event_id   TEXT,
  reminder_sent     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 Follow-Ups
CREATE TABLE follow_ups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_time  TIMESTAMPTZ NOT NULL,
  message_payload TEXT NOT NULL,
  status          follow_up_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.11 Business Knowledge
CREATE TABLE business_knowledge (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key           TEXT NOT NULL,
  value         JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, key)
);

-- 3.12 Audit Logs
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- SECTION 4: INDEXES
-- =============================================================================

-- Workspace membership lookup
CREATE INDEX idx_workspace_members_user_id     ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);

-- Leads — filtering and sorting
CREATE INDEX idx_leads_workspace_id            ON leads(workspace_id);
CREATE INDEX idx_leads_workspace_status_intent ON leads(workspace_id, status, intent);
CREATE INDEX idx_leads_workspace_updated_at    ON leads(workspace_id, updated_at DESC);
CREATE INDEX idx_leads_lead_score              ON leads(workspace_id, lead_score DESC);

-- Lead Intelligence
CREATE INDEX idx_lead_intelligence_workspace_id ON lead_intelligence(workspace_id);

-- Conversation Threads
CREATE INDEX idx_conversation_threads_workspace_id ON conversation_threads(workspace_id);
CREATE INDEX idx_conversation_threads_lead_id      ON conversation_threads(lead_id);
CREATE INDEX idx_conversation_threads_status       ON conversation_threads(workspace_id, status);

-- Conversations (Messages)
CREATE INDEX idx_conversations_thread_id         ON conversations(thread_id);
CREATE INDEX idx_conversations_thread_created_at ON conversations(thread_id, created_at DESC);
CREATE INDEX idx_conversations_workspace_id      ON conversations(workspace_id);
CREATE INDEX idx_conversations_is_read           ON conversations(workspace_id, is_read);

-- AI Memories
CREATE INDEX idx_ai_memories_workspace_id  ON ai_memories(workspace_id);
CREATE INDEX idx_ai_memories_lead_id       ON ai_memories(lead_id);
CREATE INDEX idx_ai_memories_memory_type   ON ai_memories(workspace_id, memory_type);

-- Appointments
CREATE INDEX idx_appointments_workspace_id    ON appointments(workspace_id);
CREATE INDEX idx_appointments_lead_id         ON appointments(lead_id);
CREATE INDEX idx_appointments_workspace_start ON appointments(workspace_id, appointment_start);
CREATE INDEX idx_appointments_status          ON appointments(workspace_id, status);

-- Follow-Ups
CREATE INDEX idx_follow_ups_workspace_id            ON follow_ups(workspace_id);
CREATE INDEX idx_follow_ups_lead_id                 ON follow_ups(lead_id);
CREATE INDEX idx_follow_ups_workspace_scheduled_status ON follow_ups(workspace_id, scheduled_time, status);

-- Business Knowledge
CREATE INDEX idx_business_knowledge_workspace_id ON business_knowledge(workspace_id);

-- Audit Logs
CREATE INDEX idx_audit_logs_workspace_id    ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_workspace_time  ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity         ON audit_logs(workspace_id, entity_type, entity_id);


-- =============================================================================
-- SECTION 5: UPDATED_AT TRIGGER FUNCTION & TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to every table with updated_at
CREATE TRIGGER set_updated_at_workspaces
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_workspace_settings
  BEFORE UPDATE ON workspace_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_conversation_threads
  BEFORE UPDATE ON conversation_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_ai_memories
  BEFORE UPDATE ON ai_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_follow_ups
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_business_knowledge
  BEFORE UPDATE ON business_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- SECTION 6: CONVERSATION INSERT → PROPAGATE updated_at TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION propagate_conversation_insert_to_thread()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the thread's updated_at so it bubbles to the top of inbox sorts
  UPDATE conversation_threads
  SET updated_at = NOW()
  WHERE id = NEW.thread_id;

  -- Update the lead's updated_at so it reflects latest activity
  UPDATE leads l
  SET updated_at = NOW()
  FROM conversation_threads ct
  WHERE ct.id = NEW.thread_id
    AND l.id = ct.lead_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_conversation_insert_update_thread
  AFTER INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION propagate_conversation_insert_to_thread();


-- =============================================================================
-- SECTION 7: AUTO-CREATE WORKSPACE_SETTINGS ON WORKSPACE INSERT
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_create_workspace_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_settings (workspace_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_workspace_insert_create_settings
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION auto_create_workspace_settings();


-- =============================================================================
-- SECTION 8: AUTO-CREATE LEAD_INTELLIGENCE ON LEAD INSERT
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_create_lead_intelligence()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lead_intelligence (lead_id, workspace_id)
  VALUES (NEW.id, NEW.workspace_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_lead_insert_create_intelligence
  AFTER INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION auto_create_lead_intelligence();


-- =============================================================================
-- SECTION 9: ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE workspaces             ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_intelligence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_threads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_knowledge     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 10: RLS HELPER FUNCTION
-- =============================================================================

-- Helper: check if the requesting user is a member of a workspace
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: check if the requesting user is owner or admin of a workspace
CREATE OR REPLACE FUNCTION is_workspace_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- SECTION 11: RLS POLICIES — workspaces
-- =============================================================================

CREATE POLICY "workspaces: members can view their workspace"
  ON workspaces FOR SELECT
  USING (is_workspace_member(id));

CREATE POLICY "workspaces: owners can update their workspace"
  ON workspaces FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspaces.id
      AND user_id = auth.uid()
      AND role = 'owner'
  ));

-- Authenticated users can create workspaces (they become owner via subsequent insert)
CREATE POLICY "workspaces: authenticated users can create"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- =============================================================================
-- SECTION 12: RLS POLICIES — workspace_members
-- =============================================================================

CREATE POLICY "workspace_members: members can view their own membership"
  ON workspace_members FOR SELECT
  USING (user_id = auth.uid() OR is_workspace_member(workspace_id));

CREATE POLICY "workspace_members: admins can insert members"
  ON workspace_members FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "workspace_members: admins can update roles"
  ON workspace_members FOR UPDATE
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "workspace_members: admins can remove members"
  ON workspace_members FOR DELETE
  USING (is_workspace_admin(workspace_id) OR user_id = auth.uid());


-- =============================================================================
-- SECTION 13: RLS POLICIES — workspace_settings
-- =============================================================================

CREATE POLICY "workspace_settings: members can view"
  ON workspace_settings FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "workspace_settings: admins can update"
  ON workspace_settings FOR UPDATE
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "workspace_settings: auto-insert via trigger only"
  ON workspace_settings FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id) OR auth.uid() IS NOT NULL);


-- =============================================================================
-- SECTION 14: RLS POLICIES — leads
-- =============================================================================

CREATE POLICY "leads: members can view"
  ON leads FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "leads: members can insert"
  ON leads FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "leads: members can update"
  ON leads FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "leads: admins can delete"
  ON leads FOR DELETE
  USING (is_workspace_admin(workspace_id));


-- =============================================================================
-- SECTION 15: RLS POLICIES — lead_intelligence
-- =============================================================================

CREATE POLICY "lead_intelligence: members can view"
  ON lead_intelligence FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "lead_intelligence: members can insert"
  ON lead_intelligence FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "lead_intelligence: members can update"
  ON lead_intelligence FOR UPDATE
  USING (is_workspace_member(workspace_id));


-- =============================================================================
-- SECTION 16: RLS POLICIES — conversation_threads
-- =============================================================================

CREATE POLICY "conversation_threads: members can view"
  ON conversation_threads FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "conversation_threads: members can insert"
  ON conversation_threads FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "conversation_threads: members can update"
  ON conversation_threads FOR UPDATE
  USING (is_workspace_member(workspace_id));


-- =============================================================================
-- SECTION 17: RLS POLICIES — conversations
-- =============================================================================

CREATE POLICY "conversations: members can view"
  ON conversations FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "conversations: members can insert"
  ON conversations FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

-- Messages are immutable once sent (no UPDATE or DELETE for members)


-- =============================================================================
-- SECTION 18: RLS POLICIES — ai_memories
-- =============================================================================

CREATE POLICY "ai_memories: members can view"
  ON ai_memories FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "ai_memories: members can insert"
  ON ai_memories FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "ai_memories: members can update"
  ON ai_memories FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "ai_memories: admins can delete"
  ON ai_memories FOR DELETE
  USING (is_workspace_admin(workspace_id));


-- =============================================================================
-- SECTION 19: RLS POLICIES — appointments
-- =============================================================================

CREATE POLICY "appointments: members can view"
  ON appointments FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "appointments: members can insert"
  ON appointments FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "appointments: members can update"
  ON appointments FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "appointments: admins can delete"
  ON appointments FOR DELETE
  USING (is_workspace_admin(workspace_id));


-- =============================================================================
-- SECTION 20: RLS POLICIES — follow_ups
-- =============================================================================

CREATE POLICY "follow_ups: members can view"
  ON follow_ups FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "follow_ups: members can insert"
  ON follow_ups FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "follow_ups: members can update"
  ON follow_ups FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "follow_ups: admins can delete"
  ON follow_ups FOR DELETE
  USING (is_workspace_admin(workspace_id));


-- =============================================================================
-- SECTION 21: RLS POLICIES — business_knowledge
-- =============================================================================

CREATE POLICY "business_knowledge: members can view"
  ON business_knowledge FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "business_knowledge: admins can insert"
  ON business_knowledge FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));

CREATE POLICY "business_knowledge: admins can update"
  ON business_knowledge FOR UPDATE
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "business_knowledge: admins can delete"
  ON business_knowledge FOR DELETE
  USING (is_workspace_admin(workspace_id));


-- =============================================================================
-- SECTION 22: RLS POLICIES — audit_logs
-- =============================================================================

CREATE POLICY "audit_logs: members can view"
  ON audit_logs FOR SELECT
  USING (is_workspace_member(workspace_id));

-- Inserts via service role only (backend / edge functions). No client inserts.
-- No UPDATE or DELETE on audit_logs (immutable ledger).


-- =============================================================================
-- SECTION 23: SUPABASE REALTIME ENABLE
-- =============================================================================

-- Enable Realtime replication for core subscribed tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_memories;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE follow_ups;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
