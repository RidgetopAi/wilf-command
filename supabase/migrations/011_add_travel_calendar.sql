-- Migration: Add Travel Calendar tables
-- Links travel planning with existing notes system

-- 1. TERRITORIES TABLE
-- Predefined territory zones the rep covers
CREATE TABLE territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6', -- Default blue
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rep_id, name)
);

ALTER TABLE territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own territories"
  ON territories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = territories.rep_id
    )
  );

CREATE POLICY "Reps manage own territories"
  ON territories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = territories.rep_id
    )
  );

-- 2. TRAVEL DAYS TABLE
-- One record per day when the rep has travel planned
CREATE TABLE travel_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  date DATE NOT NULL,
  territory_id UUID REFERENCES territories(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rep_id, date)
);

ALTER TABLE travel_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own travel days"
  ON travel_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = travel_days.rep_id
    )
  );

CREATE POLICY "Reps manage own travel days"
  ON travel_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = travel_days.rep_id
    )
  );

CREATE INDEX idx_travel_days_rep_date ON travel_days(rep_id, date);

-- 3. TRAVEL STOPS TABLE
-- Individual dealer stops within a travel day
CREATE TABLE travel_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_day_id UUID NOT NULL REFERENCES travel_days(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled', 'rescheduled')),
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL, -- Link to visit note
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE travel_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own travel stops"
  ON travel_stops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travel_days td
      JOIN users u ON u.rep_id = td.rep_id
      WHERE td.id = travel_stops.travel_day_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Reps manage own travel stops"
  ON travel_stops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_days td
      JOIN users u ON u.rep_id = td.rep_id
      WHERE td.id = travel_stops.travel_day_id
      AND u.id = auth.uid()
    )
  );

CREATE INDEX idx_travel_stops_day ON travel_stops(travel_day_id);
CREATE INDEX idx_travel_stops_dealer ON travel_stops(dealer_id);
CREATE INDEX idx_travel_stops_note ON travel_stops(note_id);

-- 4. SEED DEFAULT TERRITORIES (will be inserted per rep on first use)
-- Example territories for Virginia rep:
-- INSERT INTO territories (rep_id, name, color) VALUES 
--   ('78', 'Lynchburg', '#3b82f6'),
--   ('78', 'Roanoke', '#10b981'),
--   ('78', 'Charlottesville', '#f59e0b'),
--   ('78', 'Richmond', '#8b5cf6'),
--   ('78', 'Harrisonburg', '#ec4899');
