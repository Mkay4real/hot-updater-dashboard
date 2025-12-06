// lib/db.ts - Database connection utilities for Hot Updater Dashboard

import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION - Choose your database provider
// ============================================

console.log('[INIT] process.env.DB_PROVIDER at module load:', process.env.DB_PROVIDER);
const DB_PROVIDER = process.env.DB_PROVIDER || 'mock'; // 'supabase', 'postgres', 'cloudflare-d1', 'mock'
console.log('[INIT] DB_PROVIDER set to:', DB_PROVIDER);

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// PostgreSQL Configuration (if using direct connection)
// import { Pool } from 'pg';
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// ============================================
// DATABASE QUERIES
// ============================================

/**
 * Get all deployments
 */
export async function getDeployments() {
  console.log('[DEBUG] DB_PROVIDER:', DB_PROVIDER, 'from env:', process.env.DB_PROVIDER);
  if (DB_PROVIDER === 'supabase') {
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .order('deployed_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Transform to match our interface
    return data.map((row: any) => ({
      id: row.id,
      version: row.version,
      platform: row.platform,
      channel: row.channel,
      status: row.status,
      deployedAt: formatDate(row.deployed_at),
      deployedBy: row.deployed_by || 'System',
      bundleSize: formatBytes(row.bundle_size),
      downloads: row.downloads || 0,
    }));
  }

  // Mock data for development/testing
  return [
    {
      id: '1',
      version: '1.2.5',
      platform: 'ios',
      channel: 'production',
      status: 'success',
      deployedAt: '2 hours ago',
      deployedBy: 'john@example.com',
      bundleSize: '2.3 MB',
      downloads: 15420,
    },
    {
      id: '2',
      version: '1.2.5',
      platform: 'android',
      channel: 'production',
      status: 'success',
      deployedAt: '2 hours ago',
      deployedBy: 'john@example.com',
      bundleSize: '2.1 MB',
      downloads: 8930,
    },
    {
      id: '3',
      version: '1.2.4',
      platform: 'all',
      channel: 'staging',
      status: 'success',
      deployedAt: '1 day ago',
      deployedBy: 'sarah@example.com',
      bundleSize: '2.2 MB',
      downloads: 245,
    },
    {
      id: '4',
      version: '1.2.3',
      platform: 'ios',
      channel: 'production',
      status: 'success',
      deployedAt: '3 days ago',
      deployedBy: 'mike@example.com',
      bundleSize: '2.0 MB',
      downloads: 45200,
    },
  ];
}

/**
 * Get all bundles
 */
export async function getBundles() {
  if (DB_PROVIDER === 'supabase') {
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data.map((row: any) => ({
      id: row.id,
      version: row.version,
      platform: row.platform,
      channel: row.channel,
      createdAt: formatDate(row.created_at),
      size: formatBytes(row.size),
      active: row.active,
    }));
  }

  // Mock data
  return [
    {
      id: '1',
      version: '1.2.5',
      platform: 'ios',
      channel: 'production',
      createdAt: '2 hours ago',
      size: '2.3 MB',
      active: true,
    },
    {
      id: '2',
      version: '1.2.5',
      platform: 'android',
      channel: 'production',
      createdAt: '2 hours ago',
      size: '2.1 MB',
      active: true,
    },
    {
      id: '3',
      version: '1.2.4',
      platform: 'ios',
      channel: 'staging',
      createdAt: '1 day ago',
      size: '2.2 MB',
      active: false,
    },
    {
      id: '4',
      version: '1.2.4',
      platform: 'android',
      channel: 'staging',
      createdAt: '1 day ago',
      size: '2.0 MB',
      active: false,
    },
    {
      id: '5',
      version: '1.2.3',
      platform: 'ios',
      channel: 'production',
      createdAt: '3 days ago',
      size: '2.0 MB',
      active: false,
    },
    {
      id: '6',
      version: '1.2.3',
      platform: 'android',
      channel: 'production',
      createdAt: '3 days ago',
      size: '1.9 MB',
      active: false,
    },
  ];
}

/**
 * Get dashboard statistics
 */
export async function getStats() {
  if (DB_PROVIDER === 'supabase') {
    // Get total deployments
    const { count: totalDeployments } = await supabase
      .from('deployments')
      .select('*', { count: 'exact', head: true });

    // Get active users (this would need to be tracked separately)
    const { data: usersData } = await supabase
      .from('app_users')
      .select('count');

    // Get update rate
    const { data: updateData } = await supabase
      .from('update_stats')
      .select('adoption_rate')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get last deployment
    const { data: lastDeploy } = await supabase
      .from('deployments')
      .select('deployed_at')
      .order('deployed_at', { ascending: false })
      .limit(1)
      .single();

    return {
      totalDeployments: totalDeployments || 0,
      activeUsers: usersData?.[0]?.count || 0,
      updateRate: updateData?.adoption_rate || 0,
      lastDeployment: formatDate(lastDeploy?.deployed_at),
    };
  }

  // Mock data
  return {
    totalDeployments: 127,
    activeUsers: 24350,
    updateRate: 87,
    lastDeployment: '2 hours ago',
  };
}

/**
 * Rollback to a specific deployment
 */
export async function rollbackDeployment(deploymentId: string) {
  if (DB_PROVIDER === 'supabase') {
    // Get the deployment details
    const { data: deployment, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (error) throw error;

    // Create a new deployment with the old version
    const { error: insertError } = await supabase
      .from('deployments')
      .insert({
        version: deployment.version,
        platform: deployment.platform,
        channel: deployment.channel,
        status: 'success',
        deployed_by: 'system_rollback',
        bundle_size: deployment.bundle_size,
        deployed_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    return { success: true };
  }

  // For development, just return success
  return { success: true };
}

/**
 * Create database tables (run this once to set up your database)
 */
export async function createTables() {
  if (DB_PROVIDER === 'supabase') {
    // Deployments table
    await supabase.rpc('create_deployments_table', {});

    // Bundles table
    await supabase.rpc('create_bundles_table', {});

    // App users table (for tracking active users)
    await supabase.rpc('create_app_users_table', {});

    // Update stats table
    await supabase.rpc('create_update_stats_table', {});
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date: string | Date | undefined): string {
  if (!date) return 'Never';

  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// ============================================
// SQL FOR SUPABASE TABLE CREATION
// ============================================

/*
Run these SQL commands in your Supabase SQL editor:

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

-- App users table (for tracking)
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

-- Update stats table
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
*/
