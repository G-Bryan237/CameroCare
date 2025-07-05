-- Help requests table (reverse of help_offers)
CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate requests
  UNIQUE(post_id, requester_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_help_requests_post_id ON help_requests (post_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_requester_id ON help_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_helper_id ON help_requests (helper_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests (status);

-- Enable RLS
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own help requests" ON help_requests
  FOR SELECT USING (requester_id = auth.uid() OR helper_id = auth.uid());

CREATE POLICY "Users can create help requests" ON help_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Only helpers can update help request status" ON help_requests
  FOR UPDATE USING (helper_id = auth.uid());