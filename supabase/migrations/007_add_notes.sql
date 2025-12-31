-- =============================================
-- NOTES SYSTEM MIGRATION
-- File: supabase/migrations/007_add_notes.sql
-- Created: 2025-12-30
-- =============================================

-- Note types enum
CREATE TYPE note_type AS ENUM (
  'visit',
  'follow_up',
  'vp_opportunity',
  'issue',
  'quote',
  'order',
  'personal'
);

-- Email status enum (for Phase 2)
CREATE TYPE email_status AS ENUM (
  'pending',
  'sent',
  'failed'
);

-- =============================================
-- DEALER EMAILS (needed first for FK reference)
-- =============================================

CREATE TABLE dealer_emails (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id  uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  label      text,
  email      text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX dealer_emails_dealer_idx ON dealer_emails (dealer_id);

-- =============================================
-- EMAIL TEMPLATES (needed for FK reference)
-- =============================================

CREATE TABLE email_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  description       text,
  subject_template  text NOT NULL,
  body_template     text NOT NULL,
  default_for_type  note_type,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_templates_default_type_idx ON email_templates (default_for_type);

-- =============================================
-- NOTES TABLE
-- =============================================

CREATE TABLE notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id         uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  type              note_type NOT NULL DEFAULT 'visit',
  title             text,
  body              text NOT NULL,
  visit_date        date NOT NULL DEFAULT CURRENT_DATE,
  follow_up_date    date,
  -- Email flags (Phase 2 ready)
  auto_send_email   boolean NOT NULL DEFAULT false,
  dealer_email_id   uuid REFERENCES dealer_emails(id) ON DELETE SET NULL,
  email_template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notes_dealer_idx ON notes (dealer_id);
CREATE INDEX notes_dealer_date_idx ON notes (dealer_id, visit_date);
CREATE INDEX notes_type_idx ON notes (type);
CREATE INDEX notes_follow_up_date_idx ON notes (follow_up_date);

-- =============================================
-- NOTE ATTACHMENTS
-- =============================================

CREATE TABLE note_attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id       uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  file_name     text NOT NULL,
  mime_type     text,
  file_size     integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX note_attachments_note_idx ON note_attachments (note_id);

-- =============================================
-- TAGS (user-defined)
-- =============================================

CREATE TABLE tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- NOTE-TAG JUNCTION
-- =============================================

CREATE TABLE note_tags (
  note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX note_tags_tag_idx ON note_tags (tag_id);
CREATE INDEX note_tags_note_idx ON note_tags (note_id);

-- =============================================
-- NOTE EMAILS LOG (Phase 2)
-- =============================================

CREATE TABLE note_emails (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id         uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  template_id     uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  dealer_email_id uuid REFERENCES dealer_emails(id) ON DELETE SET NULL,
  to_addresses    text[] NOT NULL,
  subject         text NOT NULL,
  body            text NOT NULL,
  status          email_status NOT NULL DEFAULT 'pending',
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX note_emails_note_idx ON note_emails (note_id);
CREATE INDEX note_emails_status_idx ON note_emails (status);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE dealer_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_emails ENABLE ROW LEVEL SECURITY;

-- Dealer emails: allow all for authenticated users
CREATE POLICY "dealer_emails_all" ON dealer_emails
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Email templates: allow all for authenticated users
CREATE POLICY "email_templates_all" ON email_templates
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notes: allow all for authenticated users
CREATE POLICY "notes_all" ON notes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note attachments: allow all for authenticated users
CREATE POLICY "note_attachments_all" ON note_attachments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tags: allow all for authenticated users
CREATE POLICY "tags_all" ON tags
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note tags: allow all for authenticated users
CREATE POLICY "note_tags_all" ON note_tags
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note emails: allow all for authenticated users
CREATE POLICY "note_emails_all" ON note_emails
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
