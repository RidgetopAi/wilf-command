-- Display fixtures table
CREATE TABLE displays (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('adura', 'laminate', 'wood', 'somerset', 'bjelin', 'lauzon', 'ns_resp', 'sheet'))
);

-- Junction table for dealer displays (many-to-many)
CREATE TABLE dealer_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  display_code TEXT NOT NULL REFERENCES displays(code) ON DELETE CASCADE,
  installed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dealer_id, display_code)
);

-- RLS for displays (read-only for all authenticated users)
ALTER TABLE displays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view displays"
  ON displays FOR SELECT
  TO authenticated
  USING (true);

-- RLS for dealer_displays
ALTER TABLE dealer_displays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own dealer displays"
  ON dealer_displays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dealers d
      JOIN users u ON u.rep_id = d.rep_id
      WHERE d.id = dealer_displays.dealer_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Reps manage own dealer displays"
  ON dealer_displays FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dealers d
      JOIN users u ON u.rep_id = d.rep_id
      WHERE d.id = dealer_displays.dealer_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Managers view all dealer displays"
  ON dealer_displays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- Indexes
CREATE INDEX idx_dealer_displays_dealer_id ON dealer_displays(dealer_id);
CREATE INDEX idx_dealer_displays_display_code ON dealer_displays(display_code);
CREATE INDEX idx_displays_category ON displays(category);

-- Seed display data
INSERT INTO displays (code, name, category) VALUES
  -- Adura displays
  ('A0', 'ADURA CRAFTED EDGE STAIR STEP', 'adura'),
  ('A1', 'ADURA TILE TOWER', 'adura'),
  ('A8', 'ADURA SLCT SELLING SYS 60"', 'adura'),
  ('A9', 'ADURA DELUX SOLUTION CNTR 90"', 'adura'),
  ('M4', 'ADURA MAX APEX 2 TIER DISP', 'adura'),
  ('M5', 'ADURA MAX APEX 3 TIER DISP', 'adura'),
  ('M6', 'ADURA MAX VALUE SOL CENTER', 'adura'),
  ('M7', 'APEX 3 TIER CONV (REALTA)', 'adura'),
  ('M8', 'APEX PREMIUM', 'adura'),
  ('RA', 'REALTA SPC DISPLAY', 'adura'),
  ('RB', 'REALTA SIMPLE STAIR', 'adura'),

  -- Laminate displays
  ('LA', 'MANN LAM 30" RESTN UF 2018', 'laminate'),
  ('L5', 'LAMINATE 60" WATERFALL', 'laminate'),
  ('L7', 'RESTORATION 3-TOWER', 'laminate'),
  ('L9', 'LAMINATE 90" UF', 'laminate'),

  -- Wood displays
  ('WB', 'WOOD TOWER ANT/SMOKE', 'wood'),
  ('WC', 'WOOD TOWER SLICED OAK', 'wood'),
  ('WD', 'WOOD TOWER 3/8 SCRAPE', 'wood'),
  ('WE', 'WOOD DISTRESSED TOWER', 'wood'),
  ('WF', 'WOOD MAISON TOWER', 'wood'),
  ('WS', 'WOOD SANCTUARY SS DSP', 'wood'),
  ('W0', 'RESPONSIVE ELITE CONVERSION', 'ns_resp'),
  ('W2', 'RESPONSIVE TWO TOWERS', 'wood'),
  ('W3', 'WOOD 60" UF', 'wood'),
  ('W4', 'WOOD 90" UF', 'wood'),
  ('W5', 'WOOD WATERFALL D', 'wood'),
  ('W7', 'WOOD PREMIUM DSP', 'wood'),
  ('W9', 'CARPET ONE INVINCIBLE PREM', 'wood'),

  -- Somerset displays
  ('S0', 'SOMEREST TOD STANDARD DISPLAY', 'somerset'),
  ('S1', 'SOMERSET TOD ISLAND DISPLAY', 'somerset'),
  ('S3', 'SOMERSET TOD BIN DISPLAY 2018', 'somerset'),

  -- Bjelin displays
  ('Y0', 'BJELIN DISPLAY', 'bjelin'),
  ('Y1', 'BJELIN 24 SLOT DISLAY/CONV', 'bjelin'),
  ('Y2', 'BJELIN AMBASSADOR PREMIUM DSP', 'bjelin'),

  -- Lauzon displays
  ('ZA', 'LAUZON PURE SERIES DSP', 'lauzon'),
  ('Z0', 'LAUZON MINI REV DISPLAY', 'lauzon'),
  ('Z1', 'LZN DES INFLUENCE/EXOTICS', 'lauzon'),
  ('Z3', 'LAUZON LRG BOUTQ. DISPLAY', 'lauzon'),
  ('Z5', 'LAUZON PURE GENIUS DISP/KIT', 'lauzon'),
  ('Z6', 'LZN DUBEAU ULT MATTE DISP', 'lauzon'),
  ('Z7', 'LZN STUDIO DISPLAY', 'lauzon'),
  ('Z8', 'EXPERT BY LAUZON', 'lauzon'),
  ('Z9', 'LAUZON COLL STUDIO DISPLAY', 'lauzon'),

  -- NS & Resp displays
  ('J0', 'SAR TITAN/VERSAILLES 12 SHELF', 'ns_resp'),
  ('J1', 'SAR RIPTIDE DSP', 'ns_resp'),
  ('J2', 'SAR RENAISSANCE TILE DISPLAY', 'ns_resp'),
  ('J3', 'SAR TITAN/RIPTIDE II STACKER', 'ns_resp'),
  ('J4', 'SAR LANDMARK/RIPTIDE II STACK', 'ns_resp'),
  ('RC', 'TOWER FOR REALTA SAMPLES', 'ns_resp'),
  ('R1', 'RESPONSIVE ADD ON 2023', 'ns_resp'),
  ('R3', 'RESPONSIVE TRIPLE TOWER', 'ns_resp'),

  -- Sheet (LVS) displays
  ('R8', 'MANN REVIVE SS DISPLAY', 'sheet'),
  ('V0', 'LVS UF DSP', 'sheet');
