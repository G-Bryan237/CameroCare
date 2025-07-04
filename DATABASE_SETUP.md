# Supabase Database Schema Update

## Required Tables for Save/Share Functionality

You need to create these tables in your Supabase database:

### 1. user_bookmarks table
```sql
CREATE TABLE user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Add RLS (Row Level Security)
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own bookmarks" ON user_bookmarks
  FOR ALL USING (auth.uid() = user_id);
```

### 2. user_shares table
```sql
CREATE TABLE user_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'facebook', 'whatsapp', 'instagram', 'copy'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security)
ALTER TABLE user_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own shares" ON user_shares
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Update posts table (if columns don't exist)
```sql
-- Add bookmark and share counters to posts table if they don't exist
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS bookmarks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;
```

### 4. Database Functions for Atomic Operations
```sql
-- Function to safely increment bookmark count
CREATE OR REPLACE FUNCTION increment_bookmarks(p_post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE posts 
  SET bookmarks = COALESCE(bookmarks, 0) + 1 
  WHERE id = p_post_id 
  RETURNING bookmarks INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely decrement bookmark count
CREATE OR REPLACE FUNCTION decrement_bookmarks(p_post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE posts 
  SET bookmarks = GREATEST(COALESCE(bookmarks, 0) - 1, 0)
  WHERE id = p_post_id 
  RETURNING bookmarks INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely increment share count
CREATE OR REPLACE FUNCTION increment_shares(p_post_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE posts 
  SET shares = COALESCE(shares, 0) + 1 
  WHERE id = p_post_id 
  RETURNING shares INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_bookmarks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_bookmarks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_shares(UUID) TO authenticated;
```

## How to Apply These Changes

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run each SQL block above in order
4. Verify the tables and functions are created

## Features This Enables

- ✅ **Reliable Bookmarks**: Atomic operations prevent race conditions
- ✅ **Accurate Counters**: Database functions ensure consistent counts
- ✅ **Share Tracking**: One share count increment per user per post
- ✅ **User Privacy**: RLS ensures users only see their own bookmarks/shares
- ✅ **Data Integrity**: Proper constraints and foreign keys

After creating these tables and functions, the save and share functionality will work reliably with proper data consistency!
