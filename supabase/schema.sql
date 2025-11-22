-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  rep_id TEXT UNIQUE NOT NULL, -- Sales-I rep ID (e.g., '78')
  role TEXT NOT NULL CHECK (role IN ('rep', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Managers can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

-- 2. DEALERS TABLE
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL, -- Links to users.rep_id (Sales-I rep ID)
  user_id UUID REFERENCES users(id), -- Optional link to user UUID if needed
  
  -- Core Identifiers
  account_number TEXT NOT NULL, -- Sales-I account number
  dealer_name TEXT NOT NULL,
  location_count INTEGER DEFAULT 1,
  
  -- Attributes
  ew_program TEXT,
  buying_group TEXT,
  
  -- Market Segments
  retail BOOLEAN DEFAULT false,
  builder_dealer_controlled BOOLEAN DEFAULT false,
  builder_national_spec BOOLEAN DEFAULT false,
  commercial_negotiated BOOLEAN DEFAULT false,
  commercial_spec_bids BOOLEAN DEFAULT false,
  wholesale_to_installers BOOLEAN DEFAULT false,
  multifamily_replacement BOOLEAN DEFAULT false,
  multifamily_new BOOLEAN DEFAULT false,
  
  -- Stocking Categories
  stocking_wpc BOOLEAN DEFAULT false,
  stocking_spc BOOLEAN DEFAULT false,
  stocking_wood BOOLEAN DEFAULT false,
  stocking_specials BOOLEAN DEFAULT false,
  stocking_pad BOOLEAN DEFAULT false,
  stocking_rev_ply BOOLEAN DEFAULT false,
  
  -- Metadata
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_number, rep_id)
);

ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own dealers"
  ON dealers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = dealers.rep_id
    )
  );

CREATE POLICY "Reps update own dealers"
  ON dealers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = dealers.rep_id
    )
  );

CREATE POLICY "Reps insert own dealers"
  ON dealers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = dealers.rep_id
    )
  );

CREATE POLICY "Managers view all dealers"
  ON dealers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

CREATE INDEX idx_dealers_rep_id ON dealers(rep_id);
CREATE INDEX idx_dealers_account_number ON dealers(account_number);

-- 3. PRODUCT MIX MONTHLY
CREATE TABLE product_mix_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  account_number TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Sales Values
  adura_sales DECIMAL(12,2) DEFAULT 0,
  wood_laminate_sales DECIMAL(12,2) DEFAULT 0,
  sundries_sales DECIMAL(12,2) DEFAULT 0,
  ns_resp_sales DECIMAL(12,2) DEFAULT 0,
  sheet_sales DECIMAL(12,2) DEFAULT 0,
  
  -- Calculated Percentages
  adura_pct DECIMAL(5,2) DEFAULT 0,
  wood_laminate_pct DECIMAL(5,2) DEFAULT 0,
  sundries_pct DECIMAL(5,2) DEFAULT 0,
  ns_resp_pct DECIMAL(5,2) DEFAULT 0,
  sheet_pct DECIMAL(5,2) DEFAULT 0,
  
  total_sales DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rep_id, account_number, year, month),
  FOREIGN KEY (account_number, rep_id) REFERENCES dealers(account_number, rep_id)
);

ALTER TABLE product_mix_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own product mix"
  ON product_mix_monthly FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_monthly.rep_id
    )
  );

CREATE POLICY "Reps insert own product mix"
  ON product_mix_monthly FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_monthly.rep_id
    )
  );

CREATE POLICY "Reps update own product mix"
  ON product_mix_monthly FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_monthly.rep_id
    )
  );

CREATE POLICY "Managers view all product mix"
  ON product_mix_monthly FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

CREATE INDEX idx_product_mix_rep_account ON product_mix_monthly(rep_id, account_number);
CREATE INDEX idx_product_mix_year_month ON product_mix_monthly(year, month);

-- 4. PRODUCT MIX TARGETS
CREATE TABLE product_mix_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  
  adura_target DECIMAL(5,2) DEFAULT 0,
  wood_laminate_target DECIMAL(5,2) DEFAULT 0,
  sundries_target DECIMAL(5,2) DEFAULT 0,
  ns_resp_target DECIMAL(5,2) DEFAULT 0,
  sheet_target DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rep_id, year)
);

ALTER TABLE product_mix_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own targets"
  ON product_mix_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_targets.rep_id
    )
  );

CREATE POLICY "Reps manage own targets"
  ON product_mix_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.rep_id = product_mix_targets.rep_id
    )
  );

CREATE POLICY "Managers view all targets"
  ON product_mix_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

-- SEED DATA (Example)
-- INSERT INTO users (email, full_name, rep_id, role) VALUES ('brian@example.com', 'Brian', '78', 'rep');
