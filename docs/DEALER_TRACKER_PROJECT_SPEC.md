# DEALER TRACKING WEB APP - COMPLETE PROJECT SPECIFICATION

**Project Name:** Wilf Command (dealer tracking system)  
**Client:** Brian (Rep ID: 78)  
**Timeline:** Time-sensitive - target 5 days  
**Tech Stack:** Next.js 14 + Supabase + Vercel

---

## EXECUTIVE SUMMARY

Build a web application for flooring sales reps to track their dealer portfolios. The system imports dealer data and monthly sales from Sales-I CSV exports, calculates product mix percentages, and provides rep-level isolation with manager oversight capabilities.

**Core Value:** Automate monthly dealer tracking (currently manual Excel) with Sales-I CSV integration, product mix analytics, and role-based access control.

---

## PROJECT CONTEXT

- **Users:** 
  - Sales Reps (start with Brian only, expand to ~10-15 reps)
  - Managers (view all reps' data)
  
- **Current Process:** 
  - Manual Excel tracking using template (see attached)
  - Monthly Sales-I CSV exports
  - Manual data entry and percentage calculations
  
- **Goal:** 
  - Web-based replacement
  - CSV drag-and-drop upload ("Wilf Command" parser)
  - Auto-calculate product mix percentages
  - Rep isolation (can only see their dealers)
  - Manager aggregate view

---

## DATABASE SCHEMA

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  rep_id TEXT UNIQUE NOT NULL, -- Sales-I rep ID (e.g., '78')
  role TEXT NOT NULL CHECK (role IN ('rep', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see themselves
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Managers can see all users
CREATE POLICY "Managers can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );
```

### Dealers Table
```sql
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL, -- Links to users.rep_id (not UUID - this is Sales-I rep ID)
  user_id UUID REFERENCES users(id), -- Links to actual user
  
  -- Core Identifiers (from Sales-I)
  account_number TEXT NOT NULL, -- Sales-I account number (e.g., 'WOOD111GAL~00000')
  dealer_name TEXT NOT NULL, -- Customer - Parent Account
  location_count INTEGER DEFAULT 1, -- Manual entry by rep
  
  -- Dealer Attributes (manual entry from Sales-I account report)
  ew_program TEXT, -- e.g., 'Advantage', 'Direct Plus', 'CCA +2.0'
  buying_group TEXT, -- e.g., 'Carpet One', 'Alliance Flooring'
  
  -- Market Segments (checkboxes)
  retail BOOLEAN DEFAULT false,
  builder_dealer_controlled BOOLEAN DEFAULT false,
  builder_national_spec BOOLEAN DEFAULT false,
  commercial_negotiated BOOLEAN DEFAULT false,
  commercial_spec_bids BOOLEAN DEFAULT false,
  wholesale_to_installers BOOLEAN DEFAULT false,
  multifamily_replacement BOOLEAN DEFAULT false,
  multifamily_new BOOLEAN DEFAULT false,
  
  -- Stocking Categories (checkboxes)
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

-- Enable RLS
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

-- Reps can only see their own dealers
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

-- Managers see all dealers
CREATE POLICY "Managers view all dealers"
  ON dealers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

-- Index for performance
CREATE INDEX idx_dealers_rep_id ON dealers(rep_id);
CREATE INDEX idx_dealers_account_number ON dealers(account_number);
```

### Product Mix Table (Monthly Sales Data)
```sql
CREATE TABLE product_mix_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  account_number TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Product Categories (sales values in dollars)
  adura_sales DECIMAL(12,2) DEFAULT 0,
  wood_laminate_sales DECIMAL(12,2) DEFAULT 0,
  sundries_sales DECIMAL(12,2) DEFAULT 0,
  ns_resp_sales DECIMAL(12,2) DEFAULT 0, -- North Star & Responsive
  sheet_sales DECIMAL(12,2) DEFAULT 0,
  
  -- Calculated percentages (computed from sales)
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

-- Enable RLS
ALTER TABLE product_mix_monthly ENABLE ROW LEVEL SECURITY;

-- Reps see own product mix
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

-- Managers see all
CREATE POLICY "Managers view all product mix"
  ON product_mix_monthly FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

-- Indexes
CREATE INDEX idx_product_mix_rep_account ON product_mix_monthly(rep_id, account_number);
CREATE INDEX idx_product_mix_year_month ON product_mix_monthly(year, month);
```

### Product Mix Targets Table (Rep's Goal Percentages)
```sql
CREATE TABLE product_mix_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  
  -- Target percentages (manually entered by rep)
  adura_target DECIMAL(5,2) DEFAULT 0,
  wood_laminate_target DECIMAL(5,2) DEFAULT 0,
  sundries_target DECIMAL(5,2) DEFAULT 0,
  ns_resp_target DECIMAL(5,2) DEFAULT 0,
  sheet_target DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rep_id, year)
);

-- Enable RLS (same pattern as above)
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
```

---

## DATA MAPPING SPECIFICATIONS

### Sales-I Product Group to App Categories

**Mapping Table:**
```javascript
const PRODUCT_GROUP_MAPPING = {
  'MANN. ADURA LUXURY TILE': 'Adura',
  'BJELIN': 'Wood & Laminate',
  'LAUZON WOOD': 'Wood & Laminate',
  'PAD CARPENTER COMPANY': 'Sundries',
  'RESPONSIVE INDUSTRIES': 'NS & Resp',
  'SOMERSET WOOD': 'Wood & Laminate',
  'TITEBOND': 'Sundries',
  'MANN. LAMINATE FLOORING': 'Wood & Laminate',
  'NORTH STAR FLOORING': 'NS & Resp',
  'PAD FUTURE FOAM': 'Sundries',
  'BURKE-MERCER': 'Sundries',
  'MANNINGTON ON MAIN': 'Sundries',
  'MANN. RESIDENTIAL VINYL': 'Sheet',
  'DIVERSIFIED INDUSTRIES': 'Sundries',
  'SUREPLY AND REVOLUTIONS': 'Sundries',
  'MANN. WOOD': 'Wood & Laminate',
  'MANN. RUBBER': 'Sundries',
  'MANN. COMMERCIAL VINYL & VCT': 'Sheet'
};
```

### CSV Import Format (Monthly Sales Report)

**File Format:** `monthly-sales-YYYYMMDD.csv`

**Expected Columns:**
```
Customer - Parent  Account  Number  (e.g., 'WOOD111GAL~00000')
Product Group - C O L0              (e.g., 'MANN. ADURA LUXURY TILE')
Value                               (e.g., '22,671.06' - string with commas)
Cost                                (e.g., '18,691.16')
Profit                              (e.g., '3,979.90')
GP                                  (e.g., '17.55%')
Average Price                       (float)
Quantity                            (string with commas)
Count                               (integer)
```

### Account Number Mapping (One-Time Setup)

**File Format:** `account-number-group.csv`

**Expected Columns:**
```
Customer - Parent  Account         (dealer name)
Customer - Account  Number          (account number)
Buying Group                        (optional)
EW Program                          (optional)
```
