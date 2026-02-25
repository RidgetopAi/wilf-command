-- Migration: Add Adura Objectives table
-- Tracks per-rep activation objectives with category grouping and presented status

CREATE TABLE adura_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  account_number TEXT NOT NULL,
  display_type TEXT,
  adura_2025_sales DECIMAL(12,2) DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('up', 'rollback', 'lock_in')),
  presented BOOLEAN DEFAULT false,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rep_id, account_number)
);

ALTER TABLE adura_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adura_objectives_all" ON adura_objectives
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_adura_objectives_rep ON adura_objectives(rep_id);
