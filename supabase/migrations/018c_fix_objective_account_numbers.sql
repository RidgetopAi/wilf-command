-- Fix: account numbers need ~00000 suffix to match dealers and product_mix_monthly tables
UPDATE adura_objectives
SET account_number = account_number || '~00000'
WHERE rep_id = '78'
AND account_number NOT LIKE '%~%';
