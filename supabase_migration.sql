-- Migration to add group_name and bet_description fields to groups table
-- Run this SQL in your Supabase SQL editor

-- Add the new columns to the groups table
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS bet_description TEXT;

-- Add comments to document the new fields
COMMENT ON COLUMN groups.name IS 'Display name for the group (e.g., "Friday Night Chaos")';
COMMENT ON COLUMN groups.bet_description IS 'Description of the bet being made (e.g., "John is going to be first guy to be hammered tonight")';

-- Optional: Update existing groups to have default values
-- UPDATE groups 
-- SET name = 'Group ' || code,
--     bet_description = 'No description provided'
-- WHERE name IS NULL OR bet_description IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;
