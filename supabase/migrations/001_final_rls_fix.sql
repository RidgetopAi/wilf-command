-- FINAL FIX: Dealers RLS Policy
-- The issue: RLS policies were blocking access because the JOIN/Subquery was tricky with Auth context.
-- We confirmed data exists via Service Role bypass.
-- Now we restore RLS but make it ROBUST.

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Reps view own dealers" ON dealers;
DROP POLICY IF EXISTS "Reps update own dealers" ON dealers;
DROP POLICY IF EXISTS "Reps insert own dealers" ON dealers;

-- 2. Create a Function to get current user's rep_id
-- This runs with SECURITY DEFINER (sudo mode) so it bypasses RLS on the 'users' table
-- This eliminates the recursion/access issues completely.
CREATE OR REPLACE FUNCTION get_my_rep_id()
RETURNS text AS $$
  SELECT rep_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Create simple policies using the function
CREATE POLICY "Reps view own dealers"
  ON dealers FOR SELECT
  USING (
    rep_id = get_my_rep_id()
  );

CREATE POLICY "Reps update own dealers"
  ON dealers FOR UPDATE
  USING (
    rep_id = get_my_rep_id()
  );

CREATE POLICY "Reps insert own dealers"
  ON dealers FOR INSERT
  WITH CHECK (
    rep_id = get_my_rep_id()
  );
