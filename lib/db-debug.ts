// Quick debug script to see what's in the S3 bucket
// Run with: node -r esbuild-register lib/db-debug.ts

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config({ path: '.env.local' });

const s3Client = new S3Client({
  region: process.env.HOT_UPDATER_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.HOT_UPDATER_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.HOT_UPDATER_S3_SECRET_ACCESS_KEY || '',
  },
});

async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

async function main() {
  const bucketName = process.env.HOT_UPDATER_S3_BUCKET_NAME || '';

  console.log('Listing all objects in bucket:', bucketName);

  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
  });

  const response = await s3Client.send(listCommand);
  const objects = response.Contents || [];

  console.log(`\nFound ${objects.length} objects:`);
  objects.forEach(obj => {
    console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
  });

  const jsonFiles = objects.filter(obj => obj.Key?.endsWith('.json'));
  console.log(`\nFound ${jsonFiles.length} JSON files. Reading them...`);

  for (const jsonFile of jsonFiles) {
    console.log(`\n=== ${jsonFile.Key} ===`);
    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: jsonFile.Key,
      });

      const fileResponse = await s3Client.send(getCommand);
      const content = await streamToString(fileResponse.Body);
      const json = JSON.parse(content);

      console.log(JSON.stringify(json, null, 2));
    } catch (err) {
      console.error('Failed to read:', err);
    }
  }
}

main().catch(console.error);
