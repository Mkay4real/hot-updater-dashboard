// lib/db.ts - Database connection utilities for Hot Updater Dashboard

import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION - Choose your database provider
// ============================================

console.log('[INIT] process.env.DB_PROVIDER at module load:', process.env.DB_PROVIDER);
const DB_PROVIDER = process.env.DB_PROVIDER || 'mock'; // 'supabase', 'aws-rds', 'dynamodb', 'postgres', 'cloudflare-d1', 'mock'
console.log('[INIT] DB_PROVIDER set to:', DB_PROVIDER);

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// AWS RDS PostgreSQL Configuration
let rdsPool: any = null;
if (DB_PROVIDER === 'aws-rds') {
  const { Pool } = require('pg');
  rdsPool = new Pool({
    host: process.env.AWS_RDS_HOST,
    port: parseInt(process.env.AWS_RDS_PORT || '5432'),
    database: process.env.AWS_RDS_DATABASE,
    user: process.env.AWS_RDS_USER,
    password: process.env.AWS_RDS_PASSWORD,
    ssl: process.env.AWS_RDS_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

// DynamoDB Configuration (for Lambda@Edge)
let dynamoDBClient: any = null;
if (DB_PROVIDER === 'dynamodb') {
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

  const client = new DynamoDBClient({
    region: process.env.AWS_DYNAMODB_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  dynamoDBClient = DynamoDBDocumentClient.from(client);
}

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

  if (DB_PROVIDER === 'aws-rds') {
    const result = await rdsPool.query(
      'SELECT * FROM bundles ORDER BY id DESC LIMIT 50'
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      version: row.metadata?.app_version || row.git_commit_hash?.substring(0, 7) || 'unknown',
      platform: row.platform,
      channel: row.channel || 'production',
      status: row.enabled ? 'success' : 'failed',
      deployedAt: formatDate(row.id),
      deployedBy: row.message || 'System',
      bundleSize: 'N/A',
      downloads: 0,
    }));
  }

  if (DB_PROVIDER === 'dynamodb') {
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || 'hot-updater-bundles';

    const result = await dynamoDBClient.send(
      new ScanCommand({
        TableName: tableName,
        Limit: 50,
      })
    );

    const items = result.Items || [];
    // Sort by id descending (assuming UUIDv7 with timestamp)
    items.sort((a: any, b: any) => (b.id || '').localeCompare(a.id || ''));

    return items.map((row: any) => ({
      id: row.id,
      version: row.metadata?.app_version || row.git_commit_hash?.substring(0, 7) || 'unknown',
      platform: row.platform,
      channel: row.channel || 'production',
      status: row.enabled ? 'success' : 'failed',
      deployedAt: formatDate(row.id),
      deployedBy: row.message || 'System',
      bundleSize: 'N/A',
      downloads: 0,
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
      enabled: row.enabled,
      forceUpdate: row.should_force_update,
      message: row.message,
      fingerprintHash: row.fingerprint_hash,
      targetAppVersion: row.target_app_version,
      commitHash: row.git_commit_hash,
    }));
  }

  if (DB_PROVIDER === 'aws-rds') {
    const result = await rdsPool.query(
      'SELECT * FROM bundles ORDER BY id DESC LIMIT 20'
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      version: row.metadata?.app_version || row.git_commit_hash?.substring(0, 7) || 'unknown',
      platform: row.platform,
      channel: row.channel || 'production',
      createdAt: formatDate(row.id),
      size: 'N/A',
      active: row.enabled,
      enabled: row.enabled,
      forceUpdate: row.should_force_update,
      message: row.message,
      fingerprintHash: row.fingerprint_hash,
      targetAppVersion: row.target_app_version,
      commitHash: row.git_commit_hash,
    }));
  }

  if (DB_PROVIDER === 'dynamodb') {
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || 'hot-updater-bundles';

    const result = await dynamoDBClient.send(
      new ScanCommand({
        TableName: tableName,
        Limit: 20,
      })
    );

    const items = result.Items || [];
    items.sort((a: any, b: any) => (b.id || '').localeCompare(a.id || ''));

    return items.map((row: any) => ({
      id: row.id,
      version: row.metadata?.app_version || row.git_commit_hash?.substring(0, 7) || 'unknown',
      platform: row.platform,
      channel: row.channel || 'production',
      createdAt: formatDate(row.id),
      size: 'N/A',
      active: row.enabled,
      enabled: row.enabled,
      forceUpdate: row.should_force_update,
      message: row.message,
      fingerprintHash: row.fingerprint_hash,
      targetAppVersion: row.target_app_version,
      commitHash: row.git_commit_hash,
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
      enabled: true,
      forceUpdate: false,
      message: 'Production release v1.2.5',
      fingerprintHash: 'abc123def456',
      targetAppVersion: '1.2.5',
      commitHash: 'a1b2c3d',
    },
    {
      id: '2',
      version: '1.2.5',
      platform: 'android',
      channel: 'production',
      createdAt: '2 hours ago',
      size: '2.1 MB',
      active: true,
      enabled: true,
      forceUpdate: false,
      message: 'Production release v1.2.5',
      fingerprintHash: 'xyz789uvw012',
      targetAppVersion: '1.2.5',
      commitHash: 'a1b2c3d',
    },
    {
      id: '3',
      version: '1.2.4',
      platform: 'ios',
      channel: 'staging',
      createdAt: '1 day ago',
      size: '2.2 MB',
      active: false,
      enabled: false,
      forceUpdate: false,
      message: 'Staging test',
      fingerprintHash: 'def456ghi789',
      targetAppVersion: '1.2.4',
      commitHash: 'b2c3d4e',
    },
    {
      id: '4',
      version: '1.2.4',
      platform: 'android',
      channel: 'staging',
      createdAt: '1 day ago',
      size: '2.0 MB',
      active: false,
      enabled: false,
      forceUpdate: true,
      message: 'Critical fix',
      fingerprintHash: 'ghi789jkl012',
      targetAppVersion: '1.2.4',
      commitHash: 'b2c3d4e',
    },
    {
      id: '5',
      version: '1.2.3',
      platform: 'ios',
      channel: 'production',
      createdAt: '3 days ago',
      size: '2.0 MB',
      active: false,
      enabled: true,
      forceUpdate: false,
      message: 'Previous release',
      fingerprintHash: 'jkl012mno345',
      targetAppVersion: '1.2.3',
      commitHash: 'c3d4e5f',
    },
    {
      id: '6',
      version: '1.2.3',
      platform: 'android',
      channel: 'production',
      createdAt: '3 days ago',
      size: '1.9 MB',
      active: false,
      enabled: true,
      forceUpdate: false,
      message: 'Previous release',
      fingerprintHash: 'mno345pqr678',
      targetAppVersion: '1.2.3',
      commitHash: 'c3d4e5f',
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

  if (DB_PROVIDER === 'aws-rds') {
    const totalResult = await rdsPool.query('SELECT COUNT(*) as count FROM bundles');
    const enabledResult = await rdsPool.query('SELECT COUNT(*) as count FROM bundles WHERE enabled = true');
    const lastBundleResult = await rdsPool.query('SELECT * FROM bundles ORDER BY id DESC LIMIT 1');

    const totalDeployments = parseInt(totalResult.rows[0]?.count || '0');
    const enabledBundles = parseInt(enabledResult.rows[0]?.count || '0');
    const lastBundle = lastBundleResult.rows[0];

    return {
      totalDeployments,
      activeUsers: enabledBundles,
      updateRate: totalDeployments ? Math.round((enabledBundles / totalDeployments) * 100) : 0,
      lastDeployment: formatDate(lastBundle?.id),
    };
  }

  if (DB_PROVIDER === 'dynamodb') {
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || 'hot-updater-bundles';

    const result = await dynamoDBClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    const items = result.Items || [];
    const totalDeployments = items.length;
    const enabledBundles = items.filter((item: any) => item.enabled === true).length;

    // Get last bundle
    items.sort((a: any, b: any) => (b.id || '').localeCompare(a.id || ''));
    const lastBundle = items[0];

    return {
      totalDeployments,
      activeUsers: enabledBundles,
      updateRate: totalDeployments ? Math.round((enabledBundles / totalDeployments) * 100) : 0,
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

  if (DB_PROVIDER === 'aws-rds') {
    const bundleResult = await rdsPool.query('SELECT * FROM bundles WHERE id = $1', [deploymentId]);
    const bundle = bundleResult.rows[0];

    if (!bundle) throw new Error('Bundle not found');

    await rdsPool.query('UPDATE bundles SET enabled = $1 WHERE id = $2', [!bundle.enabled, deploymentId]);

    return { success: true };
  }

  if (DB_PROVIDER === 'dynamodb') {
    const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
    const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || 'hot-updater-bundles';

    // Get current bundle
    const getResult = await dynamoDBClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id: deploymentId },
      })
    );

    const bundle = getResult.Item;
    if (!bundle) throw new Error('Bundle not found');

    // Toggle enabled state
    await dynamoDBClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id: deploymentId },
        UpdateExpression: 'SET enabled = :enabled',
        ExpressionAttributeValues: {
          ':enabled': !bundle.enabled,
        },
      })
    );

    return { success: true };
  }

  // For development, just return success
  return { success: true };
}

/**
 * Update bundle settings (enabled, force_update, message)
 */
export async function updateBundle(bundleId: string, updates: {
  message?: string;
  enabled?: boolean;
  forceUpdate?: boolean;
}) {
  if (DB_PROVIDER === 'supabase') {
    const updateData: any = {};
    if (updates.message !== undefined) updateData.message = updates.message;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
    if (updates.forceUpdate !== undefined) updateData.should_force_update = updates.forceUpdate;

    const { error } = await supabase
      .from('bundles')
      .update(updateData)
      .eq('id', bundleId);

    if (error) throw error;
    return { success: true };
  }

  if (DB_PROVIDER === 'aws-rds') {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.message !== undefined) {
      updateFields.push(`message = $${paramIndex++}`);
      updateValues.push(updates.message);
    }
    if (updates.enabled !== undefined) {
      updateFields.push(`enabled = $${paramIndex++}`);
      updateValues.push(updates.enabled);
    }
    if (updates.forceUpdate !== undefined) {
      updateFields.push(`should_force_update = $${paramIndex++}`);
      updateValues.push(updates.forceUpdate);
    }

    if (updateFields.length === 0) return { success: true };

    updateValues.push(bundleId);
    const query = `UPDATE bundles SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;

    await rdsPool.query(query, updateValues);
    return { success: true };
  }

  if (DB_PROVIDER === 'dynamodb') {
    const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
    const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || 'hot-updater-bundles';

    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};

    if (updates.message !== undefined) {
      updateExpressions.push('message = :message');
      expressionAttributeValues[':message'] = updates.message;
    }
    if (updates.enabled !== undefined) {
      updateExpressions.push('enabled = :enabled');
      expressionAttributeValues[':enabled'] = updates.enabled;
    }
    if (updates.forceUpdate !== undefined) {
      updateExpressions.push('should_force_update = :forceUpdate');
      expressionAttributeValues[':forceUpdate'] = updates.forceUpdate;
    }

    if (updateExpressions.length === 0) return { success: true };

    await dynamoDBClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id: bundleId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    return { success: true };
  }

  // For development, just return success
  return { success: true };
}

/**
 * Delete a bundle
 */
export async function deleteBundle(bundleId: string) {
  if (DB_PROVIDER === 'supabase') {
    const { error } = await supabase
      .from('bundles')
      .delete()
      .eq('id', bundleId);

    if (error) throw error;
    return { success: true };
  }

  if (DB_PROVIDER === 'aws-rds') {
    await rdsPool.query('DELETE FROM bundles WHERE id = $1', [bundleId]);
    return { success: true };
  }

  if (DB_PROVIDER === 'dynamodb') {
    const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
    const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || 'hot-updater-bundles';

    await dynamoDBClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id: bundleId },
      })
    );

    return { success: true };
  }

  // For development, just return success
  return { success: true };
}

/**
 * Promote/Move bundle to a different channel
 */
export async function promoteBundle(bundleId: string, targetChannel: string, move: boolean) {
  if (DB_PROVIDER === 'supabase') {
    if (move) {
      // Move: update the existing bundle's channel
      const { error } = await supabase
        .from('bundles')
        .update({ channel: targetChannel })
        .eq('id', bundleId);

      if (error) throw error;
    } else {
      // Copy: fetch the bundle, create a new one with new channel
      const { data: bundle, error: fetchError } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', bundleId)
        .single();

      if (fetchError) throw fetchError;

      const { error: insertError } = await supabase
        .from('bundles')
        .insert({
          ...bundle,
          id: undefined, // Let database generate new UUID
          channel: targetChannel,
        });

      if (insertError) throw insertError;
    }

    return { success: true };
  }

  if (DB_PROVIDER === 'aws-rds') {
    if (move) {
      await rdsPool.query('UPDATE bundles SET channel = $1 WHERE id = $2', [targetChannel, bundleId]);
    } else {
      // Copy: fetch the bundle, create a new one
      const bundleResult = await rdsPool.query('SELECT * FROM bundles WHERE id = $1', [bundleId]);
      const bundle = bundleResult.rows[0];

      if (!bundle) throw new Error('Bundle not found');

      // Create copy with new channel (omit id to let DB generate new one)
      const { id, ...bundleData } = bundle;
      await rdsPool.query(
        `INSERT INTO bundles (platform, target_app_version, should_force_update, enabled,
         file_hash, git_commit_hash, message, channel, fingerprint_hash, metadata, storage_uri)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          bundleData.platform,
          bundleData.target_app_version,
          bundleData.should_force_update,
          bundleData.enabled,
          bundleData.file_hash,
          bundleData.git_commit_hash,
          bundleData.message,
          targetChannel,
          bundleData.fingerprint_hash,
          bundleData.metadata,
          bundleData.storage_uri,
        ]
      );
    }

    return { success: true };
  }

  if (DB_PROVIDER === 'dynamodb') {
    const { GetCommand, UpdateCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
    const { randomUUID } = require('crypto');
    const tableName = process.env.AWS_DYNAMODB_TABLE_NAME || 'hot-updater-bundles';

    if (move) {
      await dynamoDBClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { id: bundleId },
          UpdateExpression: 'SET channel = :channel',
          ExpressionAttributeValues: {
            ':channel': targetChannel,
          },
        })
      );
    } else {
      // Copy: fetch bundle and create copy with new channel
      const getResult = await dynamoDBClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { id: bundleId },
        })
      );

      const bundle = getResult.Item;
      if (!bundle) throw new Error('Bundle not found');

      // Create copy with new ID and channel
      await dynamoDBClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            ...bundle,
            id: randomUUID(),
            channel: targetChannel,
          },
        })
      );
    }

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
