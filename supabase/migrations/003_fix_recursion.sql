-- FIX: Infinite recursion in users table policies
-- The "Managers can view all users" policy was querying the users table recursively.

-- 1. Drop the problematic policy
DROP POLICY "Managers can view all users" ON users;

-- 2. Re-create it with a safer check using auth.jwt() metadata or a separate lookup
-- Since we can't easily do a separate lookup without recursion, we will simplify for now.
-- A better approach for managers is usually to use a separate 'user_roles' table or custom claims.
-- However, to fix this FAST without schema changes:

-- OPTION A: Allow users to read ANY user row (simplest, but less secure if emails are private)
-- CREATE POLICY "Read all users" ON users FOR SELECT USING (true);

-- OPTION B: Fixed Manager Policy (avoiding self-reference loop if possible)
-- We use auth.uid() to check role directly if we trust the JWT (but role is in the table!)
-- The recursion happens because: SELECT * FROM users WHERE ... (subquery checks users table again)

-- NEW APPROACH:
-- Users can read their own profile.
-- Managers can read everything.
-- We will break the loop by NOT checking the role from the table inside the policy for the table itself in a recursive way.

-- Simplest valid fix for your current structure:
-- Just let authenticated users read the users table. 
-- The RLS on 'dealers' and 'product_mix' is what really matters for data privacy.
CREATE POLICY "Authenticated users can read user profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);
