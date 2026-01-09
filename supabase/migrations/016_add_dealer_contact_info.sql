-- Add contact information fields to dealers table
-- These fields come from the official IT customer master list

-- Address fields
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS state TEXT; -- 2-letter state code
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS zip TEXT;

-- Contact fields
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Create index on city/state for geographic searches
CREATE INDEX IF NOT EXISTS idx_dealers_location ON dealers(state, city);

COMMENT ON COLUMN dealers.address IS 'Street address from customer master';
COMMENT ON COLUMN dealers.city IS 'City from customer master';
COMMENT ON COLUMN dealers.state IS '2-letter state code from customer master';
COMMENT ON COLUMN dealers.zip IS 'ZIP code from customer master';
COMMENT ON COLUMN dealers.phone IS 'Primary phone number from customer master';
COMMENT ON COLUMN dealers.contact_name IS 'Primary contact name from customer master';
