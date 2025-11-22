-- FIX: Dealers RLS Policy
-- The current policy does a join on the 'users' table which might be failing due to recursion or context issues.

DROP POLICY "Reps view own dealers" ON dealers;
DROP POLICY "Reps update own dealers" ON dealers;
DROP POLICY "Reps insert own dealers" ON dealers;

-- SIMPLIFIED POLICY (Option A - Recommended for immediate fix)
-- Instead of joining 'users', we will assume that if you are authenticated, 
-- you can read dealers where rep_id matches a claim or a known value.
-- BUT since rep_id is only in the public.users table, we must look it up.

-- Let's try a policy that avoids the "EXISTS" subquery if possible, or just fixes the recursion explicitly.
-- The issue is likely that the policy on 'users' table prevents the 'dealers' policy from reading the 'users' table to verify the rep_id.

-- We already fixed the users policy to be "allow all authenticated read".
-- So let's re-apply the Dealers policy to be sure it works now.

CREATE POLICY "Reps view own dealers"
  ON dealers FOR SELECT
  USING (
    rep_id IN (
      SELECT rep_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Reps update own dealers"
  ON dealers FOR UPDATE
  USING (
    rep_id IN (
      SELECT rep_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Reps insert own dealers"
  ON dealers FOR INSERT
  WITH CHECK (
    rep_id IN (
      SELECT rep_id FROM users WHERE id = auth.uid()
    )
  );
