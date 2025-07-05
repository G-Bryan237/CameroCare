-- Drop existing tables and related objects
DROP TABLE IF EXISTS help_offers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS helper_stats CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now create the tables
CREATE TABLE help_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Offer Content
  message TEXT NOT NULL,
  availability TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  skills_offered TEXT[] DEFAULT '{}',
  
  -- Helper Profile Snapshot (for historical accuracy)
  helper_profile JSONB NOT NULL,
  
  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Analytics
  response_time_minutes INTEGER
);

-- Create indexes separately
CREATE INDEX idx_help_offers_post_id ON help_offers (post_id);
CREATE INDEX idx_help_offers_helper_id ON help_offers (helper_id);
CREATE INDEX idx_help_offers_status ON help_offers (status);
CREATE INDEX idx_help_offers_created_at ON help_offers (created_at);

-- Notifications for real-time updates
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_created_at ON notifications (created_at);
CREATE INDEX idx_notifications_read ON notifications (user_id, read);

-- Helper Analytics
CREATE TABLE helper_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_offers INTEGER DEFAULT 0,
  accepted_offers INTEGER DEFAULT 0,
  completed_helps INTEGER DEFAULT 0,
  average_response_time_minutes INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  badges TEXT[] DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_help_offers_updated_at 
    BEFORE UPDATE ON help_offers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_helper_stats_updated_at 
    BEFORE UPDATE ON helper_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE help_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_stats ENABLE ROW LEVEL SECURITY;

-- Help offers policies
CREATE POLICY "Users can view their own help offers" ON help_offers
    FOR SELECT USING (helper_id = auth.uid() OR requester_id = auth.uid());

CREATE POLICY "Users can create help offers" ON help_offers
    FOR INSERT WITH CHECK (helper_id = auth.uid());

CREATE POLICY "Only requesters can update help offer status" ON help_offers
    FOR UPDATE USING (requester_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Helper stats policies
CREATE POLICY "Users can view all helper stats" ON helper_stats
    FOR SELECT TO authenticated;

CREATE POLICY "Users can update their own stats" ON helper_stats
    FOR ALL USING (user_id = auth.uid());