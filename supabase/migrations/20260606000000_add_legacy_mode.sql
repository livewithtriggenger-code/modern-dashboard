-- Additive only. Zero V2 schema changes.
ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'v2'
    CHECK (mode IN ('legacy', 'v2')),
  ADD COLUMN IF NOT EXISTS legacy_settings JSONB DEFAULT '{}'::jsonb;
