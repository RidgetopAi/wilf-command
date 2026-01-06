-- Migration: Add support for non-dealer calendar events
-- Allows adding meetings, all-day events, travel time, etc.

-- Make dealer_id nullable to support non-dealer events
ALTER TABLE travel_stops 
  ALTER COLUMN dealer_id DROP NOT NULL;

-- Add event fields
ALTER TABLE travel_stops
  ADD COLUMN event_title TEXT,
  ADD COLUMN event_type TEXT DEFAULT 'dealer_visit' 
    CHECK (event_type IN ('dealer_visit', 'meeting', 'event', 'travel', 'personal', 'blocked')),
  ADD COLUMN is_all_day BOOLEAN DEFAULT false,
  ADD COLUMN end_time TIME,
  ADD COLUMN location TEXT;

-- Add constraint: must have either dealer_id OR event_title
ALTER TABLE travel_stops
  ADD CONSTRAINT dealer_or_event_required 
    CHECK (dealer_id IS NOT NULL OR event_title IS NOT NULL);

-- Create index for event queries
CREATE INDEX idx_travel_stops_event_type ON travel_stops(event_type);

-- Update existing rows to have event_type = 'dealer_visit'
UPDATE travel_stops SET event_type = 'dealer_visit' WHERE dealer_id IS NOT NULL;
