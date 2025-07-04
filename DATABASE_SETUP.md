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

## How to Apply These Changes

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run each SQL block above in order
4. Verify the tables are created under Database > Tables

## Features This Enables

- ✅ **Persistent Bookmarks**: Users can save posts and see them across sessions
- ✅ **Accurate Counters**: Real bookmark and share counts stored in database
- ✅ **Share Tracking**: Track which platforms are used for sharing
- ✅ **User Privacy**: RLS ensures users only see their own bookmarks/shares
- ✅ **Real Names**: Better author name extraction from user metadata

After creating these tables, the save and share functionality will work correctly with persistent storage!
