-- ============================================
-- HOT UPDATER DASHBOARD - SUPABASE SETUP SQL
-- ============================================
-- Run this script in your Supabase SQL Editor to create all required tables
--
-- Instructions:
-- 1. Go to: https://app.supabase.com/project/rmeyblsygkforidrxxrv/sql/new
-- 2. Copy and paste this entire file
-- 3. Click "RUN" to execute
-- ============================================

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'all')),
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  deployed_by TEXT,
  bundle_size BIGINT,
  downloads INTEGER DEFAULT 0,
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  channel TEXT NOT NULL,
  size BIGINT NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App users table (for tracking active users)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,
  app_version TEXT,
  bundle_version TEXT,
  last_update_check TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update stats table (for analytics)
CREATE TABLE IF NOT EXISTS update_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_checks INTEGER DEFAULT 0,
  successful_updates INTEGER DEFAULT 0,
  failed_updates INTEGER DEFAULT 0,
  adoption_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deployments_channel ON deployments(channel);
CREATE INDEX IF NOT EXISTS idx_deployments_platform ON deployments(platform);
CREATE INDEX IF NOT EXISTS idx_deployments_deployed_at ON deployments(deployed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bundles_active ON bundles(active);
CREATE INDEX IF NOT EXISTS idx_app_users_bundle_version ON app_users(bundle_version);

-- Insert sample data for testing (optional - you can remove this section if not needed)
INSERT INTO deployments (version, platform, channel, status, deployed_by, bundle_size, downloads)
VALUES
  ('1.0.0', 'ios', 'production', 'success', 'admin@example.com', 2400000, 150),
  ('1.0.0', 'android', 'production', 'success', 'admin@example.com', 2100000, 89)
ON CONFLICT DO NOTHING;

INSERT INTO bundles (version, platform, channel, size, active)
VALUES
  ('1.0.0', 'ios', 'production', 2400000, true),
  ('1.0.0', 'android', 'production', 2100000, true)
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 'Setup complete! Tables created:' as message;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('deployments', 'bundles', 'app_users', 'update_stats')
ORDER BY table_name;
