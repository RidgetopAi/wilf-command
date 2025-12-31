-- =============================================
-- UPDATE NOTE TYPES ENUM
-- File: supabase/migrations/009_update_note_types.sql
-- Created: 2025-12-30
-- 
-- Split 'vp_opportunity' into 'vp' and 'opportunity'
-- Add new 'plan' type
-- =============================================

-- Add new enum values
ALTER TYPE note_type ADD VALUE IF NOT EXISTS 'vp';
ALTER TYPE note_type ADD VALUE IF NOT EXISTS 'opportunity';
ALTER TYPE note_type ADD VALUE IF NOT EXISTS 'plan';

-- Migrate existing vp_opportunity notes to 'opportunity' (or 'vp' based on your preference)
-- You can run this after the enum values are added:
-- UPDATE notes SET type = 'opportunity' WHERE type = 'vp_opportunity';

-- Note: PostgreSQL doesn't allow removing enum values easily
-- The old 'vp_opportunity' value will remain but won't be used by the UI
