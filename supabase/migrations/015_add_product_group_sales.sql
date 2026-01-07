-- Product Group Sales - Individual product group tracking
-- Complements product_mix_monthly (category aggregates) with granular detail
-- Enables period comparisons and growth analysis for all 18 product groups

CREATE TABLE product_group_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  account_number TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  product_group TEXT NOT NULL,      -- e.g., 'NORTH STAR FLOORING'
  category TEXT NOT NULL,            -- e.g., 'ns_resp' (for filtering)
  sales DECIMAL(12,2) DEFAULT 0,
  qty DECIMAL(12,2) DEFAULT 0,
  orders INTEGER DEFAULT 0,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(rep_id, account_number, year, month, product_group)
);

-- Indexes for common queries
CREATE INDEX idx_pgs_rep_account ON product_group_sales(rep_id, account_number);
CREATE INDEX idx_pgs_rep_year ON product_group_sales(rep_id, year);
CREATE INDEX idx_pgs_account_year ON product_group_sales(account_number, year, month);
CREATE INDEX idx_pgs_category ON product_group_sales(category);

-- Row Level Security (following StopSheet pattern - permissive + query filtering)
ALTER TABLE product_group_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_group_sales_all" ON product_group_sales
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
