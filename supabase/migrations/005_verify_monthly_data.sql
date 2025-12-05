-- ============================================
-- VERIFICATION QUERIES FOR MONTHLY SALES DATA
-- Run these in Supabase SQL Editor to compare
-- against source CSV files
-- ============================================

-- 1. DETAILED MONTHLY DATA BY DEALER
-- Compare this output against your monthly CSV files
-- Adjust year/month as needed
SELECT
    d.dealer_name AS "Customer - Parent Account",
    p.year,
    p.month,
    p.adura_sales,
    p.wood_laminate_sales,
    p.sundries_sales,
    p.ns_resp_sales,
    p.sheet_sales,
    p.total_sales,
    -- Include qty and orders if columns exist
    COALESCE(p.adura_orders, 0) +
    COALESCE(p.wood_laminate_orders, 0) +
    COALESCE(p.sundries_orders, 0) +
    COALESCE(p.ns_resp_orders, 0) +
    COALESCE(p.sheet_orders, 0) AS total_orders,
    COALESCE(p.total_qty, 0) AS total_qty
FROM product_mix_monthly p
JOIN dealers d ON p.account_number = d.account_number AND p.rep_id = d.rep_id
WHERE p.rep_id = '78'  -- Change to your rep_id
  AND p.year = 2025
  AND p.month = 5      -- May 2025 to match monthly-sales-202505.csv
ORDER BY p.total_sales DESC;


-- 2. MONTHLY TOTALS SUMMARY
-- Quick check: sum totals for a month to compare against CSV grand total
SELECT
    year,
    month,
    COUNT(DISTINCT account_number) AS dealer_count,
    SUM(adura_sales) AS total_adura,
    SUM(wood_laminate_sales) AS total_wood_laminate,
    SUM(sundries_sales) AS total_sundries,
    SUM(ns_resp_sales) AS total_ns_resp,
    SUM(sheet_sales) AS total_sheet,
    SUM(total_sales) AS grand_total_sales,
    SUM(COALESCE(total_orders, 0)) AS grand_total_orders
FROM product_mix_monthly
WHERE rep_id = '78'  -- Change to your rep_id
  AND year = 2025
  AND month = 5
GROUP BY year, month;


-- 3. ALL MONTHS COMPARISON
-- See all uploaded months at a glance
SELECT
    year,
    month,
    COUNT(*) AS records,
    SUM(total_sales) AS total_sales,
    SUM(COALESCE(total_orders, 0)) AS total_orders
FROM product_mix_monthly
WHERE rep_id = '78'  -- Change to your rep_id
GROUP BY year, month
ORDER BY year, month;


-- 4. FIND MISSING DEALERS
-- Dealers in DB but with no sales data for a specific month
SELECT d.dealer_name, d.account_number
FROM dealers d
WHERE d.rep_id = '78'  -- Change to your rep_id
  AND NOT EXISTS (
    SELECT 1 FROM product_mix_monthly p
    WHERE p.account_number = d.account_number
      AND p.rep_id = d.rep_id
      AND p.year = 2025
      AND p.month = 5
  )
ORDER BY d.dealer_name;


-- 5. YTD TOTALS (Jan-Oct 2025)
-- Compare against your YTD report
SELECT
    d.dealer_name,
    SUM(p.total_sales) AS ytd_sales,
    SUM(COALESCE(p.total_orders, 0)) AS ytd_orders,
    SUM(p.adura_sales) AS ytd_adura,
    SUM(p.wood_laminate_sales) AS ytd_wood_laminate,
    SUM(p.sundries_sales) AS ytd_sundries,
    SUM(p.ns_resp_sales) AS ytd_ns_resp,
    SUM(p.sheet_sales) AS ytd_sheet
FROM product_mix_monthly p
JOIN dealers d ON p.account_number = d.account_number AND p.rep_id = d.rep_id
WHERE p.rep_id = '78'  -- Change to your rep_id
  AND p.year = 2025
  AND p.month BETWEEN 1 AND 10
GROUP BY d.dealer_name
ORDER BY ytd_sales DESC;


-- 6. YTD GRAND TOTALS
SELECT
    SUM(total_sales) AS ytd_grand_total,
    SUM(COALESCE(total_orders, 0)) AS ytd_total_orders,
    COUNT(DISTINCT account_number) AS unique_dealers
FROM product_mix_monthly
WHERE rep_id = '78'  -- Change to your rep_id
  AND year = 2025
  AND month BETWEEN 1 AND 10;


-- 7. CHECK FOR DUPLICATE ENTRIES
-- Should return 0 rows if no duplicates
SELECT rep_id, account_number, year, month, COUNT(*)
FROM product_mix_monthly
WHERE rep_id = '78'
GROUP BY rep_id, account_number, year, month
HAVING COUNT(*) > 1;


-- 8. PRODUCT GROUP BREAKDOWN (recreate CSV format)
-- This query shows what was aggregated from each product group
-- Compare against raw CSV line items
SELECT
    d.dealer_name AS "Customer",
    'ADURA' AS category,
    p.adura_sales AS value,
    COALESCE(p.adura_orders, 0) AS count
FROM product_mix_monthly p
JOIN dealers d ON p.account_number = d.account_number AND p.rep_id = d.rep_id
WHERE p.rep_id = '78' AND p.year = 2025 AND p.month = 5 AND p.adura_sales > 0

UNION ALL

SELECT
    d.dealer_name,
    'WOOD/LAMINATE',
    p.wood_laminate_sales,
    COALESCE(p.wood_laminate_orders, 0)
FROM product_mix_monthly p
JOIN dealers d ON p.account_number = d.account_number AND p.rep_id = d.rep_id
WHERE p.rep_id = '78' AND p.year = 2025 AND p.month = 5 AND p.wood_laminate_sales > 0

UNION ALL

SELECT
    d.dealer_name,
    'SUNDRIES',
    p.sundries_sales,
    COALESCE(p.sundries_orders, 0)
FROM product_mix_monthly p
JOIN dealers d ON p.account_number = d.account_number AND p.rep_id = d.rep_id
WHERE p.rep_id = '78' AND p.year = 2025 AND p.month = 5 AND p.sundries_sales > 0

UNION ALL

SELECT
    d.dealer_name,
    'NS_RESP',
    p.ns_resp_sales,
    COALESCE(p.ns_resp_orders, 0)
FROM product_mix_monthly p
JOIN dealers d ON p.account_number = d.account_number AND p.rep_id = d.rep_id
WHERE p.rep_id = '78' AND p.year = 2025 AND p.month = 5 AND p.ns_resp_sales > 0

UNION ALL

SELECT
    d.dealer_name,
    'SHEET',
    p.sheet_sales,
    COALESCE(p.sheet_orders, 0)
FROM product_mix_monthly p
JOIN dealers d ON p.account_number = d.account_number AND p.rep_id = d.rep_id
WHERE p.rep_id = '78' AND p.year = 2025 AND p.month = 5 AND p.sheet_sales > 0

ORDER BY 1, 2;
