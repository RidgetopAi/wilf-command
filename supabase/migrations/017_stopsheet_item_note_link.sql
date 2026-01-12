-- =============================================
-- STOPSHEET ITEM NOTE LINK MIGRATION
-- File: supabase/migrations/017_stopsheet_item_note_link.sql
-- Created: 2025-01-12
-- Purpose: Add 'promotion' note type and link notes to stopsheet templates and items
-- =============================================

-- Add 'promotion' to note_type enum
ALTER TYPE note_type ADD VALUE 'promotion';

-- Add note_id column to stopsheet_templates for linking notes at template level
-- These get copied to stopsheet_items when a new stopsheet is created
ALTER TABLE stopsheet_templates
ADD COLUMN note_id UUID REFERENCES notes(id) ON DELETE SET NULL;

-- Add note_id column to stopsheet_items (copied from template or set per-instance)
ALTER TABLE stopsheet_items
ADD COLUMN note_id UUID REFERENCES notes(id) ON DELETE SET NULL;

-- Indexes for efficient lookups
CREATE INDEX idx_stopsheet_templates_note ON stopsheet_templates(note_id);
CREATE INDEX idx_stopsheet_items_note ON stopsheet_items(note_id);

-- Comments for documentation
COMMENT ON COLUMN stopsheet_templates.note_id IS 'Optional link to a note (e.g., promotion with PDF). Copied to items on stopsheet creation.';
COMMENT ON COLUMN stopsheet_items.note_id IS 'Optional link to a note (inherited from template or set per-instance).';
