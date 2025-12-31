-- =============================================
-- MAKE DEALER_ID OPTIONAL ON NOTES
-- File: supabase/migrations/008_notes_optional_dealer.sql
-- Created: 2025-12-30
-- 
-- Notes can now exist without a dealer assignment
-- =============================================

-- Make dealer_id nullable
ALTER TABLE notes ALTER COLUMN dealer_id DROP NOT NULL;

-- Add index for notes without dealer (for querying all notes)
CREATE INDEX notes_created_at_idx ON notes (created_at DESC);
CREATE INDEX notes_visit_date_idx ON notes (visit_date DESC);
