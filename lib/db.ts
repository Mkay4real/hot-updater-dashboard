// lib/db.ts - Database connection utilities for Hot Updater Dashboard

import { createClient } from '@supabase/supabase-js';

// ============================================
// HOT UPDATER OFFICIAL SERVER API
// ============================================

/**
 * Note: Hot Updater provides an official @hot-updater/server package with APIs like:
 * - getBundles({ where, limit, offset })
 * - getBundleById(id)
 * - getChannels()
 * - insertBundle(), updateBundleById(), deleteBundleById()
 *
 * However, it has bundling conflicts with Next.js due to fumadb ESM/CommonJS issues.
 * For now, we use direct S3/database access which is stable and working.
 *
 * Future: When Next.js 15+ or Hot Updater resolves these issues, we can migrate to:
 * ```typescript
 * import { createHotUpdater } from '@hot-updater/server';
 * import { s3Database, s3Storage } from '@hot-updater/aws';
 * const api = createHotUpdater({ database: s3Database(...), storages: [...] });
 * const bundles = await api.getBundles({ limit: 50 });
 * ```
 */

// ============================================
// CONFIGURATION - Choose your database provider
// ============================================

console.log('[INIT] process.env.DB_PROVIDER at module load:', process.env.DB_PROVIDER);
const DB_PROVIDER = process.env.DB_PROVIDER || 'mock'; // 'supabase', 'aws', 'aws-rds', 'dynamodb', 'postgres', 'cloudflare-d1', 'mock'
console.log('[INIT] DB_PROVIDER set to:', DB_PROVIDER);

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// AWS RDS PostgreSQL Configuration
// Note: Uses Hot Updater's officially supported PostgreSQL provider
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

// AWS S3-Only Configuration (Hot Updater's official AWS provider)
// Uses s3Database + s3Storage - metadata stored as JSON files in S3
let s3ClientAWS: any = null;
if (DB_PROVIDER === 'aws') {
  const { S3Client } = require('@aws-sdk/client-s3');

  s3ClientAWS = new S3Client({
    region: process.env.HOT_UPDATER_S3_REGION || process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.HOT_UPDATER_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.HOT_UPDATER_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  // Note: Hot Updater Official Server API initialization moved to lazy loading
  // to avoid Next.js bundling conflicts with fumadb dependencies
}

// AWS S3 Configuration (for bundle file storage with aws-rds)
// Hot Updater stores bundle files in S3 and metadata in RDS
let s3Client: any = null;
if (DB_PROVIDER === 'aws-rds' && process.env.AWS_S3_BUCKET_NAME) {
  const { S3Client } = require('@aws-sdk/client-s3');

  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

// ⚠️ EXPERIMENTAL: DynamoDB Configuration
// WARNING: DynamoDB is NOT officially supported by Hot Updater.
// This is a custom implementation for this dashboard only.
// Hot Updater officially supports: Supabase, PostgreSQL, Cloudflare D1, and Firebase.
// Use at your own risk - you'll need to manually create and manage the DynamoDB table.
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
// HELPER FUNCTIONS FOR AWS S3 PROVIDER
// ============================================

/**
 * Helper function to read bundle metadata from Hot Updater's s3Database
 * Hot Updater stores metadata as JSON files in S3 bucket
 */
async function readS3BundlesMetadata() {
  if (!s3ClientAWS) return [];

  const { ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
  const bucketName = process.env.HOT_UPDATER_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || '';

  try {
    console.log(`[AWS S3] Listing objects in bucket: ${bucketName}`);

    // Hot Updater's s3Database stores metadata - try listing all objects first
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
    });

    const listResponse = await s3ClientAWS.send(listCommand);
    const objects = listResponse.Contents || [];

    console.log(`[AWS S3] Found ${objects.length} total objects in bucket`);
    if (objects.length > 0) {
      console.log('[AWS S3] Sample keys:', objects.slice(0, 10).map((o: any) => o.Key));
    }

    // Hot Updater s3Database possible storage patterns:
    // 1. database.json - single database file with all bundles
    // 2. bundles.json - bundles manifest
    // 3. [platform]/[channel]/metadata.json - per-platform/channel metadata
    // 4. Individual bundle metadata files

    const possibleDatabaseFiles = [
      'database.json',
      'bundles.json',
      'metadata.json',
      'hot-updater/database.json',
      'hot-updater/bundles.json',
      '.hot-updater/database.json',
    ];

    for (const possibleFile of possibleDatabaseFiles) {
      const found = objects.find((obj: any) => obj.Key === possibleFile);
      if (found) {
        console.log(`[AWS S3] Found database file: ${found.Key}`);
        try {
          const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: found.Key,
          });

          const response = await s3ClientAWS.send(getCommand);
          const bodyContents = await streamToString(response.Body);
          const data = JSON.parse(bodyContents);

          // Database file might be array or object with bundles property
          const bundles = Array.isArray(data) ? data : (data.bundles || data.data || []);
          console.log(`[AWS S3] Found ${bundles.length} bundles in ${found.Key}`);
          return bundles;
        } catch (err) {
          console.warn(`[AWS S3] Failed to read ${found.Key}:`, err);
        }
      }
    }

    // If no single database file, look for update.json files (Hot Updater's bundle metadata)
    // Pattern: {channel}/{platform}/{version}/update.json
    const jsonFiles = objects.filter((obj: any) =>
      obj.Key?.endsWith('/update.json')
    );

    console.log(`[AWS S3] Found ${jsonFiles.length} update.json files:`);
    console.log('[AWS S3] JSON file paths:', jsonFiles.map((f: any) => f.Key));

    const bundlesData = [];
    for (const jsonFile of jsonFiles.slice(0, 50)) { // Limit to prevent too many requests
      try {
        console.log(`[AWS S3] Reading ${jsonFile.Key}...`);
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: jsonFile.Key,
        });

        const response = await s3ClientAWS.send(getCommand);
        const bodyContents = await streamToString(response.Body);
        const metadata = JSON.parse(bodyContents);

        // Extract metadata from file path (e.g., "production/android/3.1.13/update.json")
        const pathMetadata = extractMetadataFromPath(jsonFile.Key);

        // Hot Updater's update.json files contain ARRAYS of bundles
        if (Array.isArray(metadata)) {
          console.log(`[AWS S3] ${jsonFile.Key} contains ${metadata.length} bundles`);

          // Extract individual bundles from the array
          for (const bundle of metadata) {
            // Extract timestamp from UUIDv7 if available
            const timestamp = bundle.id ? extractTimestampFromUUIDv7(bundle.id) : null;

            // Try to get bundle size from S3 if bundle has an ID
            let bundleSize = 'N/A';
            if (bundle.id) {
              try {
                const { HeadObjectCommand } = require('@aws-sdk/client-s3');
                const headCommand = new HeadObjectCommand({
                  Bucket: bucketName,
                  Key: `${bundle.id}/bundle.zip`,
                });
                const sizeResponse = await s3ClientAWS.send(headCommand);
                if (sizeResponse.ContentLength) {
                  const kb = sizeResponse.ContentLength / 1024;
                  bundleSize = kb > 1024
                    ? `${(kb / 1024).toFixed(2)} MB`
                    : `${kb.toFixed(2)} KB`;
                }
              } catch {
                // Bundle file might not exist yet
              }
            }

            bundlesData.push({
              ...bundle,
              // Add metadata from file path
              channel: bundle.channel || pathMetadata.channel,
              platform: bundle.platform || pathMetadata.platform,
              appVersion: pathMetadata.version,
              // Add timestamps
              createdAt: timestamp || jsonFile.LastModified,
              lastModified: jsonFile.LastModified,
              // Add bundle size
              size: bundleSize,
              // Keep track of source
              s3Key: jsonFile.Key,
            });
          }
        } else if (metadata && typeof metadata === 'object') {
          // Single bundle object or other metadata file
          console.log(`[AWS S3] ${jsonFile.Key} is a single object with keys:`, Object.keys(metadata));

          const timestamp = metadata.id ? extractTimestampFromUUIDv7(metadata.id) : null;

          bundlesData.push({
            ...metadata,
            channel: metadata.channel || pathMetadata.channel,
            platform: metadata.platform || pathMetadata.platform,
            appVersion: pathMetadata.version,
            createdAt: timestamp || jsonFile.LastModified,
            lastModified: jsonFile.LastModified,
            s3Key: jsonFile.Key,
          });
        }
      } catch (err) {
        console.warn(`[AWS S3] Failed to read ${jsonFile.Key}:`, err);
      }
    }

    console.log(`[AWS S3] Successfully extracted ${bundlesData.length} bundles from ${jsonFiles.length} files`);
    return bundlesData;
  } catch (error) {
    console.error('[AWS S3] Failed to read bundles metadata:', error);
    throw error;
  }
}

/**
 * Helper to convert S3 stream to string
 */
async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

/**
 * Extract timestamp from UUIDv7
 * UUIDv7 format: First 48 bits contain Unix timestamp in milliseconds
 */
function extractTimestampFromUUIDv7(uuid: string): Date | null {
  try {
    // Remove hyphens and get first 12 hex characters
    const hex = uuid.replace(/-/g, '').substring(0, 12);
    // Convert to decimal (milliseconds since Unix epoch)
    const timestamp = parseInt(hex, 16);
    return new Date(timestamp);
  } catch {
    return null;
  }
}

/**
 * Get bundle size from S3 AWS (for use with Hot Updater API)
 * Bundle files are stored as: {bundle-id}/bundle.zip
 */
async function getBundleSizeFromS3AWS(bundleId: string): Promise<string> {
  if (!s3ClientAWS) return 'N/A';

  try {
    const { HeadObjectCommand } = require('@aws-sdk/client-s3');
    const bucketName = process.env.HOT_UPDATER_S3_BUCKET_NAME || '';

    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: `${bundleId}/bundle.zip`,
    });

    const response = await s3ClientAWS.send(command);
    if (response.ContentLength) {
      const kb = response.ContentLength / 1024;
      return kb > 1024
        ? `${(kb / 1024).toFixed(2)} MB`
        : `${kb.toFixed(2)} KB`;
    }
  } catch {
    // Bundle file might not exist yet
  }

  return 'N/A';
}

/**
 * Extract channel, platform, and version from S3 file path
 * Examples:
 * - "production/android/3.1.13/update.json" → { channel: "production", platform: "android", version: "3.1.13" }
 * - "staging/ios/3.1.12/update.json" → { channel: "staging", platform: "ios", version: "3.1.12" }
 */
function extractMetadataFromPath(filePath: string): { channel?: string; platform?: string; version?: string } {
  const parts = filePath.split('/');

  // Pattern: {channel}/{platform}/{version}/update.json
  if (parts.length >= 4 && parts[parts.length - 1] === 'update.json') {
    return {
      channel: parts[0],
      platform: parts[1],
      version: parts[2],
    };
  }

  return {};
}

/**
 * Helper to generate a simple ID
 */
function generateId(): string {
  return `bundle-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

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

  if (DB_PROVIDER === 'aws') {
    try {
      const bundlesData = await readS3BundlesMetadata();
      console.log(`[AWS S3] Processing ${bundlesData.length} bundles for deployments view`);

      const deployments = bundlesData
        .sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.lastModified || 0);
          const dateB = new Date(b.createdAt || b.lastModified || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 50)
        .map((bundle: any) => ({
          id: bundle.id || generateId(),
          version: bundle.appVersion || bundle.version || 'unknown',
          platform: bundle.platform || 'all',
          channel: bundle.channel || 'production',
          status: bundle.enabled !== false ? 'success' : 'failed',
          deployedAt: formatDate(bundle.createdAt || bundle.lastModified),
          deployedBy: bundle.message || bundle.deployedBy || 'System',
          bundleSize: bundle.size || 'N/A',
          downloads: bundle.downloads || 0,
        }));

      console.log(`[AWS S3] Returning ${deployments.length} deployments`);
      return deployments;
    } catch (error) {
      console.warn('[AWS] Connection failed, falling back to mock data:', error);
      // Fall through to mock data below
    }
  }

  if (DB_PROVIDER === 'aws-rds') {
    try {
      const result = await rdsPool.query(
        'SELECT * FROM bundles ORDER BY id DESC LIMIT 50'
      );

      // Fetch bundle sizes from S3 if S3 client is configured
      const deploymentsWithSizes = await Promise.all(
        result.rows.map(async (row: any) => {
          let bundleSize = 'N/A';

          // Try to get actual size from S3 if storage_uri exists
          if (s3Client && row.storage_uri) {
            bundleSize = await getBundleSizeFromS3(row.storage_uri);
          }

          return {
            id: row.id,
            version: row.metadata?.app_version || row.git_commit_hash?.substring(0, 7) || 'unknown',
            platform: row.platform,
            channel: row.channel || 'production',
            status: row.enabled ? 'success' : 'failed',
            deployedAt: formatDate(row.id),
            deployedBy: row.message || 'System',
            bundleSize,
            downloads: 0, // Hot Updater doesn't track downloads in bundles table
            storageUri: row.storage_uri, // Include for potential download links
          };
        })
      );

      return deploymentsWithSizes;
    } catch (error) {
      console.warn('[AWS RDS] Connection failed, falling back to mock data:', error);
      // Fall through to mock data below
    }
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

  if (DB_PROVIDER === 'aws') {
    try {
      const bundlesData = await readS3BundlesMetadata();
      console.log(`[AWS S3] Processing ${bundlesData.length} bundles for bundles view`);

      const bundles = bundlesData
        .sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.lastModified || 0);
          const dateB = new Date(b.createdAt || b.lastModified || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 20)
        .map((bundle: any) => ({
          id: bundle.id || generateId(),
          version: bundle.appVersion || bundle.version || 'unknown',
          platform: bundle.platform || 'all',
          channel: bundle.channel || 'production',
          createdAt: formatDate(bundle.createdAt || bundle.lastModified),
          size: bundle.size || 'N/A',
          active: bundle.enabled !== false,
          enabled: bundle.enabled !== false,
          forceUpdate: bundle.shouldForceUpdate || bundle.forceUpdate || false,
          message: bundle.message || '',
          fingerprintHash: bundle.fingerprintHash || '',
          targetAppVersion: bundle.targetAppVersion || bundle.appVersion || '',
          commitHash: bundle.gitCommitHash || '',
        }));

      console.log(`[AWS S3] Returning ${bundles.length} bundles`);
      return bundles;
    } catch (error) {
      console.warn('[AWS] Connection failed, falling back to mock data:', error);
      // Fall through to mock data below
    }
  }

  if (DB_PROVIDER === 'aws-rds') {
    try {
      const result = await rdsPool.query(
        'SELECT * FROM bundles ORDER BY id DESC LIMIT 20'
      );

      // Fetch bundle sizes from S3 if S3 client is configured
      const bundlesWithSizes = await Promise.all(
        result.rows.map(async (row: any) => {
          let size = 'N/A';

          // Try to get actual size from S3 if storage_uri exists
          if (s3Client && row.storage_uri) {
            size = await getBundleSizeFromS3(row.storage_uri);
          }

          return {
            id: row.id,
            version: row.metadata?.app_version || row.git_commit_hash?.substring(0, 7) || 'unknown',
            platform: row.platform,
            channel: row.channel || 'production',
            createdAt: formatDate(row.id),
            size,
            active: row.enabled,
            enabled: row.enabled,
            forceUpdate: row.should_force_update,
            message: row.message,
            fingerprintHash: row.fingerprint_hash,
            targetAppVersion: row.target_app_version,
            commitHash: row.git_commit_hash,
            storageUri: row.storage_uri, // Include for download URLs
          };
        })
      );

      return bundlesWithSizes;
    } catch (error) {
      console.warn('[AWS RDS] Connection failed, falling back to mock data:', error);
      // Fall through to mock data below
    }
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

  if (DB_PROVIDER === 'aws') {
    try {
      const bundlesData = await readS3BundlesMetadata();
      console.log(`[AWS S3] Calculating stats from ${bundlesData.length} bundles`);

      const totalDeployments = bundlesData.length;
      const enabledBundles = bundlesData.filter((b: any) => b.enabled !== false).length;

      const sortedBundles = bundlesData.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.lastModified || 0);
        const dateB = new Date(b.createdAt || b.lastModified || 0);
        return dateB.getTime() - dateA.getTime();
      });

      const lastBundle = sortedBundles[0];

      console.log(`[AWS S3] Stats: ${totalDeployments} total, ${enabledBundles} enabled`);

      return {
        totalDeployments,
        activeUsers: enabledBundles,
        updateRate: totalDeployments ? Math.round((enabledBundles / totalDeployments) * 100) : 0,
        lastDeployment: formatDate(lastBundle?.createdAt || lastBundle?.lastModified),
      };
    } catch (error) {
      console.warn('[AWS] Connection failed, falling back to mock data:', error);
      // Fall through to mock data below
    }
  }

  if (DB_PROVIDER === 'aws-rds') {
    try {
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
    } catch (error) {
      console.warn('[AWS RDS] Connection failed, falling back to mock data:', error);
      // Fall through to mock data below
    }
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

  if (DB_PROVIDER === 'aws') {
    // AWS S3 provider currently doesn't support direct bundle updates
    // Hot Updater's s3Database is designed to be written only by the CLI
    throw new Error('Bundle updates are not supported for AWS S3 provider. Please redeploy using the Hot Updater CLI to make changes.');
  }

  // For development with mock data, just return success
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

  if (DB_PROVIDER === 'aws') {
    // AWS S3 provider currently doesn't support direct bundle deletion
    // Hot Updater's s3Database is designed to be written only by the CLI
    throw new Error('Bundle deletion is not supported for AWS S3 provider. Bundles are managed by the Hot Updater CLI.');
  }

  // For development with mock data, just return success
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

  if (DB_PROVIDER === 'aws') {
    // AWS S3 provider currently doesn't support direct bundle promotion
    // Hot Updater's s3Database is designed to be written only by the CLI
    throw new Error('Bundle promotion is not supported for AWS S3 provider. Please deploy to the target channel using the Hot Updater CLI.');
  }

  // For development with mock data, just return success
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
// AWS S3 HELPER FUNCTIONS
// ============================================

/**
 * Get bundle size from S3 storage_uri
 * Extracts the S3 key from storage_uri and fetches file size
 */
async function getBundleSizeFromS3(storageUri: string): Promise<string> {
  if (!s3Client || !storageUri) return 'N/A';

  try {
    const { HeadObjectCommand } = require('@aws-sdk/client-s3');

    // Extract S3 key from storage_uri
    // storage_uri format: s3://bucket-name/path/to/file.zip or https://bucket.s3.region.amazonaws.com/path/to/file.zip
    let s3Key = '';

    if (storageUri.startsWith('s3://')) {
      // Format: s3://bucket-name/path/to/file.zip
      s3Key = storageUri.split('/').slice(3).join('/');
    } else if (storageUri.includes('.s3.') || storageUri.includes('.amazonaws.com')) {
      // Format: https://bucket.s3.region.amazonaws.com/path/to/file.zip
      const url = new URL(storageUri);
      s3Key = url.pathname.substring(1); // Remove leading /
    } else {
      return 'N/A';
    }

    const command = new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    return formatBytes(response.ContentLength);
  } catch (error) {
    console.error('Error fetching S3 bundle size:', error);
    return 'N/A';
  }
}

/**
 * Generate presigned URL for downloading bundle from S3
 * Used for direct downloads from the dashboard
 * @param storageUri - The S3 storage URI from the bundles table
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned download URL or null if S3 is not configured
 */
export async function generateS3DownloadUrl(storageUri: string, expiresIn: number = 3600): Promise<string | null> {
  if (!s3Client || !storageUri) return null;

  try {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    // Extract S3 key from storage_uri
    let s3Key = '';

    if (storageUri.startsWith('s3://')) {
      s3Key = storageUri.split('/').slice(3).join('/');
    } else if (storageUri.includes('.s3.') || storageUri.includes('.amazonaws.com')) {
      const url = new URL(storageUri);
      s3Key = url.pathname.substring(1);
    } else {
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating S3 presigned URL:', error);
    return null;
  }
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
