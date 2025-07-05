# Enhanced Database Schema for P2P Help Platform

## Core Tables

### 1. Enhanced Posts Table
```sql
-- Add interaction tracking to existing posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS urgency_level INTEGER DEFAULT 1, -- 1-5 scale
ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(50),
ADD COLUMN IF NOT EXISTS skills_required TEXT[],
ADD COLUMN IF NOT EXISTS reward_type VARCHAR(20) DEFAULT 'none'; -- 'none', 'monetary', 'exchange', 'community_points'
```

### 2. Help Interactions Table
```sql
CREATE TABLE help_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL, -- 'offer_help', 'request_help'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled'
  message TEXT,
  pre_filled_message TEXT,
  estimated_completion DATE,
  actual_completion DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(post_id, helper_id, requester_id)
);

-- Add RLS
ALTER TABLE help_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions" ON help_interactions
  FOR SELECT USING (auth.uid() = helper_id OR auth.uid() = requester_id);

CREATE POLICY "Users can create interactions" ON help_interactions
  FOR INSERT WITH CHECK (auth.uid() = helper_id OR auth.uid() = requester_id);

CREATE POLICY "Users can update their interactions" ON help_interactions
  FOR UPDATE USING (auth.uid() = helper_id OR auth.uid() = requester_id);
```

### 3. User Profiles Enhancement
```sql
-- Enhance user profiles with trust and gamification
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  show_avatar BOOLEAN DEFAULT false, -- Privacy control
  location_region VARCHAR(50),
  skills TEXT[],
  availability_status VARCHAR(20) DEFAULT 'available', -- 'available', 'busy', 'unavailable'
  
  -- Trust & Verification
  is_verified BOOLEAN DEFAULT false,
  verification_type VARCHAR(20), -- 'phone', 'email', 'government_id', 'community'
  trust_score DECIMAL(3,2) DEFAULT 0.00,
  
  -- Gamification
  total_helps_given INTEGER DEFAULT 0,
  total_helps_received INTEGER DEFAULT 0,
  community_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  
  -- Activity tracking
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);
```

### 4. Badges & Achievements System
```sql
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50),
  rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  criteria JSONB, -- Flexible criteria for earning badges
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT false,
  
  UNIQUE(user_id, badge_id)
);

-- Add RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are public" ON user_badges
  FOR SELECT USING (true);
```

### 5. Notifications System
```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'help_offer', 'help_request', 'interaction_update', 'badge_earned'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional context data
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS and indexes
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
```

## Database Functions

### Interaction Management Functions
```sql
-- Function to create help interaction with automatic notifications
CREATE OR REPLACE FUNCTION create_help_interaction(
  p_post_id UUID,
  p_helper_id UUID,
  p_requester_id UUID,
  p_interaction_type VARCHAR,
  p_message TEXT,
  p_pre_filled_message TEXT
) RETURNS UUID AS $$
DECLARE
  interaction_id UUID;
  post_author UUID;
  notification_title TEXT;
BEGIN
  -- Insert interaction
  INSERT INTO help_interactions (
    post_id, helper_id, requester_id, interaction_type, 
    message, pre_filled_message
  ) VALUES (
    p_post_id, p_helper_id, p_requester_id, p_interaction_type,
    p_message, p_pre_filled_message
  ) RETURNING id INTO interaction_id;
  
  -- Get post author for notifications
  SELECT author_id INTO post_author FROM posts WHERE id = p_post_id;
  
  -- Create notification
  IF p_interaction_type = 'offer_help' THEN
    notification_title := 'Someone offered to help!';
  ELSE
    notification_title := 'Someone requested your help!';
  END IF;
  
  INSERT INTO notifications (user_id, type, title, message, data) VALUES (
    CASE WHEN p_interaction_type = 'offer_help' THEN post_author ELSE p_requester_id END,
    'interaction_' || p_interaction_type,
    notification_title,
    COALESCE(p_message, p_pre_filled_message),
    jsonb_build_object('interaction_id', interaction_id, 'post_id', p_post_id)
  );
  
  -- Update post interaction count
  UPDATE posts SET 
    interaction_count = interaction_count + 1,
    last_activity_at = NOW()
  WHERE id = p_post_id;
  
  RETURN interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_help_interaction(UUID, UUID, UUID, VARCHAR, TEXT, TEXT) TO authenticated;
```
