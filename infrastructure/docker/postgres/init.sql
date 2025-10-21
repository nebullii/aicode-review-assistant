-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id INTEGER UNIQUE NOT NULL,
  github_username VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  avatar_url VARCHAR(500),
  github_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  github_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  full_name VARCHAR(400) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  webhook_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create repository_config table
CREATE TABLE IF NOT EXISTS repository_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE UNIQUE,
  enable_security BOOLEAN DEFAULT true,
  enable_performance BOOLEAN DEFAULT true,
  enable_style BOOLEAN DEFAULT true,
  enable_redundancy BOOLEAN DEFAULT true,
  severity_threshold VARCHAR(10) DEFAULT 'medium',
  exclude_paths JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  pr_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  processing_time FLOAT
);

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  pr_number INTEGER,
  pr_title TEXT,
  pr_url TEXT,
  sender_username VARCHAR(255),
  payload JSONB,
  received_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_repository_id ON analyses(repository_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_repository_id ON webhook_events(repository_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at DESC);

-- Insert test data (optional - for development)
INSERT INTO users (github_id, github_username, email) 
VALUES (12345, 'test_user', 'test@example.com')
ON CONFLICT (github_id) DO NOTHING;