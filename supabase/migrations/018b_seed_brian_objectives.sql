-- Seed: Brian's Adura Activation Objectives (rep_id = '78')
-- 28 unique accounts across 3 categories
-- WOOD111GAL deduped: 3 rows summed to $59,224.51

INSERT INTO adura_objectives (rep_id, account_number, display_type, adura_2025_sales, category, comments) VALUES
-- UP (Under Performing) - 13 accounts
('78', 'HOUS231SOU', 'Adura 60"', 13717.84, 'up', NULL),
('78', 'BYDE129HAR', 'Adura 60"', 10739.02, 'up', NULL),
('78', 'CARP363ROA', 'Adura 60"', 5499.00, 'up', NULL),
('78', 'CARPRT4GRE', 'Adura 60"', 4378.54, 'up', NULL),
('78', 'CAVA385EAR', 'Adura Dlx', 4242.53, 'up', NULL),
('78', 'FASH439ROA', 'Adura 60"', 15148.88, 'up', NULL),
('78', 'FLOO180CHA', 'Adura 60"', 21732.50, 'up', NULL),
('78', 'FLOO880LYN', 'Adura Dlx', 26913.49, 'up', NULL),
('78', 'HALLRT2EVI', 'Adura 60"', 20859.00, 'up', NULL),
('78', 'NEWC149DAN', 'Adura 60"', 4516.82, 'up', NULL),
('78', 'WHIT317SAL', 'Adura Dlx', 21968.32, 'up', NULL),
('78', 'MILL750SOP', 'Adura 60"', 10316.10, 'up', '3 displays registered to one loc'),
('78', 'NEAT427LEW', 'Adura 60"', 17143.35, 'up', NULL),
-- Rollback - 4 accounts
('78', 'BBMA340ROA', 'Adura 60"', 29212.18, 'rollback', NULL),
('78', 'BHFL600CHA', 'Adura 60"', 41047.53, 'rollback', NULL),
('78', 'SQUI425DAN', 'Adura 60"', 28372.86, 'rollback', NULL),
('78', 'WHIT125ROA', 'Adura Dlx', 42710.65, 'rollback', NULL),
-- Adura Lock-In - 11 accounts (WOOD111GAL deduped, FAYE + FLOO385 added per user)
('78', 'CARP237MAR', 'Adura Dlx', 13687.51, 'lock_in', NULL),
('78', 'CARP411ROA', 'Adura Dlx', 143519.33, 'lock_in', NULL),
('78', 'CARP785ROA', 'Adura Dlx', 82411.20, 'lock_in', NULL),
('78', 'CENT560LYN', 'Adura Dlx', 127906.87, 'lock_in', NULL),
('78', 'ELPC242CHR', 'Adura Dlx', 19118.69, 'lock_in', NULL),
('78', 'FARM167FAR', 'Adura Dlx', 62194.63, 'lock_in', NULL),
('78', 'SAND122CHA', 'Adura Dlx', 80492.60, 'lock_in', NULL),
('78', 'SPEN130LEX', 'Adura 60"', 96360.53, 'lock_in', NULL),
('78', 'WOOD111GAL', 'Adura Dlx', 59224.51, 'lock_in', NULL),
('78', 'FAYE155OAK', 'Adura 60"', 60865.45, 'lock_in', NULL),
('78', 'FLOO385CHR', 'Adura 60"', 53255.77, 'lock_in', NULL);
