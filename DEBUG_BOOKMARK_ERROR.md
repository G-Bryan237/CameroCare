# Check if bookmarks and shares columns exist in posts table

## Step 1: Check Current Posts Table Structure
Go to your Supabase Dashboard → Database → Tables → posts → and look at the columns.

## Step 2: Add Missing Columns (if needed)
If you don't see `bookmarks` and `shares` columns, run this SQL:

```sql
-- Add bookmark and share counters to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS bookmarks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;

-- Update existing posts to have default values
UPDATE posts 
SET bookmarks = 0, shares = 0 
WHERE bookmarks IS NULL OR shares IS NULL;
```

## Step 3: Verify Tables Exist
Make sure these tables exist (run the SQL from DATABASE_SETUP.md if they don't):

```sql
-- Check if user_bookmarks table exists
SELECT * FROM user_bookmarks LIMIT 1;

-- Check if user_shares table exists  
SELECT * FROM user_shares LIMIT 1;

-- Check posts table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;
```

## Step 4: Test the API
After adding the columns, try bookmarking a post again. The detailed error messages should now show what's wrong if there are still issues.
