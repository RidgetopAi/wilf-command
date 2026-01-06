-- Add travel_stop_id to notes table to allow linking notes to calendar events
-- This enables:
-- 1. Adding notes to regular (non-dealer) events
-- 2. Linking dealer notes to events (e.g., sales notes for a "Pad-A-Thon" event)

ALTER TABLE notes
ADD COLUMN travel_stop_id UUID REFERENCES travel_stops(id) ON DELETE SET NULL;

-- Index for efficient lookup of notes by event
CREATE INDEX idx_notes_travel_stop_id ON notes(travel_stop_id) WHERE travel_stop_id IS NOT NULL;

-- Comment for clarity
COMMENT ON COLUMN notes.travel_stop_id IS 'Optional link to a calendar event (travel_stop). Allows notes to be associated with events.';
