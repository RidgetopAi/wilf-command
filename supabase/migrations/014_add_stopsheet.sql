-- StopSheet System
-- A checklist system for consistent dealer visit execution

-- Template items (master checklist configuration per rep)
CREATE TABLE stopsheet_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('basics', 'objectives')),
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Completed stopsheet instances (one per dealer visit)
CREATE TABLE stopsheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  travel_stop_id UUID REFERENCES travel_stops(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual checked items for a stopsheet
CREATE TABLE stopsheet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stopsheet_id UUID NOT NULL REFERENCES stopsheets(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES stopsheet_templates(id) ON DELETE SET NULL,
  section TEXT NOT NULL CHECK (section IN ('basics', 'objectives')),
  label TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stopsheet_templates_rep ON stopsheet_templates(rep_id, section, sort_order);
CREATE INDEX idx_stopsheets_rep_dealer ON stopsheets(rep_id, dealer_id, visit_date);
CREATE INDEX idx_stopsheets_rep_date ON stopsheets(rep_id, visit_date DESC);
CREATE INDEX idx_stopsheet_items_stopsheet ON stopsheet_items(stopsheet_id, sort_order);

-- Row Level Security
ALTER TABLE stopsheet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stopsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stopsheet_items ENABLE ROW LEVEL SECURITY;

-- Policies (authenticated users can access all - rep filtering done in queries)
CREATE POLICY "stopsheet_templates_all" ON stopsheet_templates
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "stopsheets_all" ON stopsheets
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "stopsheet_items_all" ON stopsheet_items
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
