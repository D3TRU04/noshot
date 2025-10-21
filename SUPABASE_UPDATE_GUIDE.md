# Supabase Database Update Guide

## Overview
This guide will help you update your Supabase database to include the new `name` and `bet_description` fields in the `groups` table.

## Step 1: Run the SQL Migration

1. **Open your Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project
   - Go to the **SQL Editor** tab

2. **Execute the Migration SQL**
   Copy and paste the following SQL into the SQL Editor and run it:

```sql
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
UPDATE groups 
SET name = 'Group ' || code,
    bet_description = 'No description provided'
WHERE name IS NULL OR bet_description IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'groups' 
ORDER BY ordinal_position;
```

## Step 2: Verify the Changes

After running the migration, you should see the new columns in your `groups` table:

- `name` (TEXT, nullable)
- `bet_description` (TEXT, nullable)

## Step 3: Update Your Application Code

The application code has already been updated to use these new fields:

### ✅ Already Updated:
- **Group Creation**: Now includes `name` and `bet_description` fields
- **TypeScript Types**: Updated to include the new fields
- **UI Components**: Display the group name and bet description
- **Settings Modal**: Allows editing of these fields

### 🔧 Database Schema Changes:

**Before:**
```sql
groups:
- id (uuid)
- code (text)
- creator_wallet (text)
- max_members (integer)
- bet_duration_hours (integer)
- created_at (timestamp)
```

**After:**
```sql
groups:
- id (uuid)
- code (text)
- name (text) ← NEW
- bet_description (text) ← NEW
- creator_wallet (text)
- max_members (integer)
- bet_duration_hours (integer)
- created_at (timestamp)
```

## Step 4: Test the Changes

1. **Create a new group** with a custom name and bet description
2. **Verify the data** is saved correctly in Supabase
3. **Check the settings modal** allows editing these fields
4. **Confirm the game page** displays the bet description

## Troubleshooting

### If you get permission errors:
- Make sure you're logged in as the project owner
- Check that RLS (Row Level Security) policies allow the operations

### If the migration fails:
- Check that the `groups` table exists
- Verify you have the correct permissions
- Try running the ALTER TABLE commands one by one

### If existing data is affected:
- The migration includes an UPDATE statement to set default values
- You can modify the default values as needed
- Existing groups will get default names like "Group ABC123"

## Next Steps

After running this migration:
1. Your app will be able to create groups with custom names and bet descriptions
2. Group creators can edit these fields through the settings modal
3. The game page will display the bet description prominently
4. All existing functionality will continue to work

## Rollback (if needed)

If you need to rollback these changes:

```sql
-- Remove the new columns (WARNING: This will delete data)
ALTER TABLE groups 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS bet_description;
```

**⚠️ Warning**: Rolling back will permanently delete the name and bet_description data.
