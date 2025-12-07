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
 * Get all deployments (from hot-updater bundles table)
 */
export async function getDeployments() {
  console.log('[DEBUG] DB_PROVIDER:', DB_PROVIDER, 'from env:', process.env.DB_PROVIDER);
  if (DB_PROVIDER === 'supabase') {
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .order('id', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Transform hot-updater bundles to match our deployment interface
    return data.map((row: any) => ({
      id: row.id,
      version: row.metadata?.app_version || row.git_commit_hash?.substring(0, 7) || 'unknown',
      platform: row.platform,
      channel: row.channel || 'production',
      status: row.enabled ? 'success' : 'failed',
      deployedAt: formatDate(row.id), // UUIDv7 contains timestamp
      deployedBy: row.message || 'System',
      bundleSize: 'N/A', // Size info not directly available
      downloads: 0, // Hot updater doesn't track downloads in bundles table
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
 * Get all bundles (from hot-updater bundles table)
 */
export async function getBundles() {
  if (DB_PROVIDER === 'supabase') {
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .order('id', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data.map((row: any) => ({
      id: row.id,
      version: row.metadata?.app_version || row.git_commit_hash?.substring(0, 7) || 'unknown',
      platform: row.platform,
      channel: row.channel || 'production',
      createdAt: formatDate(row.id), // UUIDv7 contains timestamp
      size: 'N/A', // Size info in storage_uri, not directly queryable
      active: row.enabled,
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
 * Get dashboard statistics (from hot-updater bundles table)
 */
export async function getStats() {
  if (DB_PROVIDER === 'supabase') {
    // Get total bundles/deployments
    const { count: totalDeployments } = await supabase
      .from('bundles')
      .select('*', { count: 'exact', head: true });

    // Get enabled bundles count
    const { count: enabledBundles } = await supabase
      .from('bundles')
      .select('*', { count: 'exact', head: true })
      .eq('enabled', true);

    // Get last bundle
    const { data: lastBundle } = await supabase
      .from('bundles')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    return {
      totalDeployments: totalDeployments || 0,
      activeUsers: enabledBundles || 0, // Using enabled bundles as proxy for active deployments
      updateRate: totalDeployments ? Math.round((enabledBundles || 0) / totalDeployments * 100) : 0,
      lastDeployment: formatDate(lastBundle?.id),
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
 * Rollback to a specific deployment (enable/disable bundle)
 */
export async function rollbackDeployment(deploymentId: string) {
  if (DB_PROVIDER === 'supabase') {
    // Get the bundle details
    const { data: bundle, error } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (error) throw error;

    // In hot-updater, rollback means toggling the enabled state
    // or you could disable all other bundles in the same channel and enable this one
    const { error: updateError } = await supabase
      .from('bundles')
      .update({ enabled: !bundle.enabled })
      .eq('id', deploymentId);

    if (updateError) throw updateError;

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
// HOT UPDATER SCHEMA REFERENCE
// ============================================

/*
This dashboard works with the Hot Updater CLI's existing Supabase schema.

Hot Updater automatically creates the following table structure when you run:
  npx hot-updater init

BUNDLES TABLE SCHEMA (created by hot-updater):
- id: UUID (UUIDv7 with embedded timestamp)
- platform: TEXT ('ios' or 'android')
- target_app_version: TEXT (nullable - specific app version this bundle targets)
- should_force_update: BOOLEAN (whether to force update on clients)
- enabled: BOOLEAN (whether this bundle is active/deployable)
- file_hash: TEXT (SHA256 hash of the bundle file)
- git_commit_hash: TEXT (Git commit hash when bundle was created)
- message: TEXT (deployment message/notes)
- channel: TEXT (deployment channel: 'development', 'staging', 'production')
- fingerprint_hash: TEXT (unique fingerprint for bundle identification)
- metadata: JSONB (additional metadata like app_version)
- storage_uri: TEXT (location of bundle file in storage)

The dashboard reads from this existing structure and transforms it for display.

To set up Hot Updater with Supabase:
1. Run: npx hot-updater init
2. Select Supabase as your provider
3. The CLI will automatically create the required tables and storage bucket
4. Configure this dashboard's .env.local with the same Supabase credentials

For more information, visit: https://hot-updater.dev
*/
