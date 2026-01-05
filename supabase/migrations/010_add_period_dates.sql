-- Add period_start and period_end to track date range coverage for cumulative uploads
-- Allows weekly/daily uploads that replace monthly data while showing partial vs complete months

ALTER TABLE product_mix_monthly
ADD COLUMN period_start DATE,
ADD COLUMN period_end DATE;

-- Add comment for documentation
COMMENT ON COLUMN product_mix_monthly.period_start IS 'First day of the data coverage period (e.g., 2025-01-01)';
COMMENT ON COLUMN product_mix_monthly.period_end IS 'Last day of the data coverage period (e.g., 2025-01-16 for partial month)';
