-- First, let's safely drop existing tables if we want to start fresh
-- Comment out these lines if you want to keep existing data
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS help_offers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS helper_stats CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create unified help_offers table (combining both schemas)
CREATE TABLE help_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core message (from both schemas)
  message TEXT NOT NULL,
  
  -- Extended offer details (from help_offers.sql)
  availability TEXT,
  contact_method TEXT DEFAULT 'platform',
  skills_offered TEXT[] DEFAULT '{}',
  
  -- Helper profile snapshot (from help_offers.sql)
  helper_profile JSONB DEFAULT '{}',
  
  -- Status tracking (combined from both)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Analytics (from help_offers.sql)
  response_time_minutes INTEGER,
  
  -- Prevent duplicate offers (from help_system.sql)
  UNIQUE(post_id, helper_id)
);

-- Conversations table (from help_system.sql)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  last_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate conversations for the same post
  UNIQUE(post_id, helper_id, requester_id)
);

-- Messages table (from help_system.sql)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (from help_offers.sql)
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

-- Helper stats table (from help_offers.sql)
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

-- Create all indexes
CREATE INDEX idx_help_offers_post_id ON help_offers (post_id);
CREATE INDEX idx_help_offers_helper_id ON help_offers (helper_id);
CREATE INDEX idx_help_offers_status ON help_offers (status);
CREATE INDEX idx_help_offers_created_at ON help_offers (created_at);

CREATE INDEX idx_conversations_participants ON conversations (helper_id, requester_id);
CREATE INDEX idx_conversations_post_id ON conversations (post_id);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_created_at ON messages (created_at);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_created_at ON notifications (created_at);
CREATE INDEX idx_notifications_read ON notifications (user_id, read);

-- Timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_help_offers_updated_at 
    BEFORE UPDATE ON help_offers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_helper_stats_updated_at 
    BEFORE UPDATE ON helper_stats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE help_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for help_offers
CREATE POLICY "Users can view their own help offers" ON help_offers
    FOR SELECT USING (helper_id = auth.uid() OR requester_id = auth.uid());

CREATE POLICY "Users can create help offers" ON help_offers
    FOR INSERT WITH CHECK (helper_id = auth.uid());

CREATE POLICY "Only requesters can update help offer status" ON help_offers
    FOR UPDATE USING (requester_id = auth.uid());

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (helper_id = auth.uid() OR requester_id = auth.uid());

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (helper_id = auth.uid() OR requester_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.helper_id = auth.uid() OR conversations.requester_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.helper_id = auth.uid() OR conversations.requester_id = auth.uid())
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for helper_stats
CREATE POLICY "Users can view all helper stats" ON helper_stats
    FOR SELECT TO authenticated;

CREATE POLICY "Users can update their own stats" ON helper_stats
    FOR ALL USING (user_id = auth.uid());