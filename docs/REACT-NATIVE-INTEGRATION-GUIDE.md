# 🚀 Hot Updater - Complete React Native Integration Guide

**Last Updated:** November 13, 2025  
**Version:** 1.0.0  
**For:** React Native Projects

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What is Hot Updater?](#what-is-hot-updater)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Self-Hosting Setup](#self-hosting-setup)
6. [React Native Client Integration](#react-native-client-integration)
7. [Configuration Examples](#configuration-examples)
8. [Deployment Workflow](#deployment-workflow)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

---

## Overview

This guide provides complete instructions for integrating Hot Updater into your React Native project. Hot Updater is a self-hosted OTA (Over-The-Air) update solution that allows you to push JavaScript bundle updates to your users instantly without going through app store review processes.

**Alternative to:** Microsoft CodePush (discontinued)

**Documentation:** https://hot-updater.dev

**GitHub:** https://github.com/gronxb/hot-updater

---

## What is Hot Updater?

Hot Updater is a self-hostable OTA update solution that gives you complete control over your update infrastructure.

### Key Features:
- ✅ **Self-Hosted** - You own and control everything
- ✅ **Multi-Platform** - iOS and Android support
- ✅ **No App Store Delays** - Update JavaScript instantly
- ✅ **Version Control** - Semantic versioning built-in
- ✅ **Forced Updates** - Push critical security fixes
- ✅ **Channel Management** - dev, staging, production environments
- ✅ **Rollback Support** - Revert to previous versions
- ✅ **CDN Support** - Fast downloads globally
- ✅ **Plugin System** - Works with any storage provider
- ✅ **New Architecture** - Supports React Native new architecture

### How It Works:
```
1. Developer runs: npx hot-updater deploy
2. JS bundle uploaded to your cloud storage (S3/Supabase/Cloudflare)
3. App checks for updates on startup
4. Downloads new bundle if available
5. Installs and restarts with new code
```

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 20+** installed
- ✅ **React Native project** (any version)
- ✅ **Cloud storage account** (AWS, Supabase, or Cloudflare)
- ✅ **Basic terminal/CLI knowledge**

### Supported React Native Versions:
- React Native 0.60+
- Expo (with custom dev client)
- New Architecture compatible
- Hermes compatible

---

## Installation

### Step 1: Install CLI Tools

```bash
# Navigate to your React Native project
cd /path/to/your/react-native-project

# Install Hot Updater CLI as dev dependency
npm install hot-updater --save-dev
# or
yarn add hot-updater --dev
```

### Step 2: Install React Native Client

```bash
# Install the client library
npm install @hot-updater/react-native
# or
yarn add @hot-updater/react-native
```

### Step 3: Initialize Hot Updater

```bash
# Run initialization wizard
npx hot-updater init
```

This will:
- ✅ Prompt you to choose a storage provider
- ✅ Set up necessary infrastructure (S3 bucket, etc.)
- ✅ Generate configuration files:
  - `.env.hotupdater` (credentials - don't commit!)
  - `hot-updater.config.ts` (configuration)

---

## Self-Hosting Setup

Hot Updater requires 3 components:
1. **Storage** - Where bundles are stored (S3, Supabase, Cloudflare R2)
2. **Database** - Metadata about versions, channels
3. **CDN** (optional) - Faster global distribution

### Option 1: AWS S3 (Most Popular)

#### Prerequisites:
```bash
# Install AWS CLI
brew install awscli  # macOS
# or
sudo apt install awscli  # Linux

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (e.g., us-east-1)
```

#### Install AWS Plugin:
```bash
npm install @hot-updater/aws @hot-updater/bare
```

#### Configuration (`hot-updater.config.ts`):
```typescript
import { bare } from '@hot-updater/bare';
import { s3Storage, s3Database } from '@hot-updater/aws';
import { defineConfig } from 'hot-updater';
import { config } from 'dotenv';

config({ path: '.env.hotupdater' });

const options = {
  bucketName: process.env.HOT_UPDATER_S3_BUCKET_NAME!,
  region: process.env.HOT_UPDATER_S3_REGION!,
  credentials: {
    accessKeyId: process.env.HOT_UPDATER_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.HOT_UPDATER_S3_SECRET_ACCESS_KEY!,
  },
};

export default defineConfig({
  build: bare({ 
    enableHermes: true  // Set to false if not using Hermes
  }),
  storage: s3Storage(options),
  database: s3Database(options),
});
```

#### Environment Variables (`.env.hotupdater`):
```env
HOT_UPDATER_S3_BUCKET_NAME=your-bucket-name
HOT_UPDATER_S3_REGION=us-east-1
HOT_UPDATER_S3_ACCESS_KEY_ID=AKIA...
HOT_UPDATER_S3_SECRET_ACCESS_KEY=...
```

---

### Option 2: Supabase (Easiest + Free Tier)

#### Why Supabase?
- ✅ Free tier (500MB storage)
- ✅ Built-in authentication
- ✅ Easy web UI
- ✅ Both storage + database in one place

#### Setup Steps:

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Create Storage Bucket:**
   - In Supabase dashboard → Storage
   - Create new bucket: `hot-updater-bundles`
   - Make it public

3. **Install Supabase Plugin:**
```bash
npm install @hot-updater/supabase @hot-updater/metro
```

4. **Configuration (`hot-updater.config.ts`):**
```typescript
import { metro } from '@hot-updater/metro';
import { supabaseDatabase, supabaseStorage } from '@hot-updater/supabase';
import { defineConfig } from 'hot-updater';
import { config } from 'dotenv';

config({ path: '.env.hotupdater' });

export default defineConfig({
  build: metro(),
  storage: supabaseStorage({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseAnonKey: process.env.HOT_UPDATER_SUPABASE_ANON_KEY!,
    bucketName: process.env.HOT_UPDATER_SUPABASE_BUCKET_NAME!,
  }),
  database: supabaseDatabase({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseAnonKey: process.env.HOT_UPDATER_SUPABASE_ANON_KEY!,
  }),
});
```

5. **Environment Variables (`.env.hotupdater`):**
```env
HOT_UPDATER_SUPABASE_URL=https://xxxxx.supabase.co
HOT_UPDATER_SUPABASE_ANON_KEY=eyJhbGc...
HOT_UPDATER_SUPABASE_BUCKET_NAME=hot-updater-bundles
```

---

### Option 3: Cloudflare R2 + D1 (Best Performance)

#### Why Cloudflare?
- ✅ Cheaper than S3
- ✅ No egress fees
- ✅ Global CDN included
- ✅ Excellent performance

#### Setup Steps:

1. **Get Cloudflare Account:**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Get Account ID from dashboard
   - Create API token (R2 and D1 permissions)

2. **Create R2 Bucket:**
```bash
npm install -g wrangler
wrangler r2 bucket create hot-updater-bundles
```

3. **Create D1 Database:**
```bash
wrangler d1 create hot-updater-db
```

4. **Install Cloudflare Plugin:**
```bash
npm install @hot-updater/cloudflare @hot-updater/bare
```

5. **Configuration (`hot-updater.config.ts`):**
```typescript
import { bare } from '@hot-updater/bare';
import { d1Database, r2Storage } from '@hot-updater/cloudflare';
import { defineConfig } from 'hot-updater';
import { config } from 'dotenv';

config({ path: '.env.hotupdater' });

export default defineConfig({
  build: bare({ enableHermes: true }),
  storage: r2Storage({
    bucketName: process.env.HOT_UPDATER_CLOUDFLARE_R2_BUCKET_NAME!,
    accountId: process.env.HOT_UPDATER_CLOUDFLARE_ACCOUNT_ID!,
    cloudflareApiToken: process.env.HOT_UPDATER_CLOUDFLARE_API_TOKEN!,
  }),
  database: d1Database({
    databaseId: process.env.HOT_UPDATER_CLOUDFLARE_D1_DATABASE_ID!,
    accountId: process.env.HOT_UPDATER_CLOUDFLARE_ACCOUNT_ID!,
    cloudflareApiToken: process.env.HOT_UPDATER_CLOUDFLARE_API_TOKEN!,
  }),
});
```

6. **Environment Variables (`.env.hotupdater`):**
```env
HOT_UPDATER_CLOUDFLARE_R2_BUCKET_NAME=hot-updater-bundles
HOT_UPDATER_CLOUDFLARE_D1_DATABASE_ID=xxxxx
HOT_UPDATER_CLOUDFLARE_ACCOUNT_ID=xxxxx
HOT_UPDATER_CLOUDFLARE_API_TOKEN=xxxxx
```

---

### Quick Comparison

| Provider | Cost | Setup | Performance | Free Tier |
|----------|------|-------|-------------|-----------|
| **AWS S3** | $$ | Medium | Excellent | Limited |
| **Supabase** | $ | Easy | Good | 500MB |
| **Cloudflare R2** | $ | Medium | Excellent | 10GB |

**Recommendation:** Start with Supabase for easiest setup.

---

## React Native Client Integration

### Step 1: Basic Integration

#### In your main `App.tsx` or `App.js`:

```typescript
import React, { useEffect } from 'react';
import { HotUpdater } from '@hot-updater/react-native';
import { Alert } from 'react-native';

function App() {
  useEffect(() => {
    // Check for updates when app starts
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await HotUpdater.checkForUpdate();
      
      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          `Version ${update.version} is available. Would you like to update?`,
          [
            {
              text: 'Later',
              style: 'cancel',
            },
            {
              text: 'Update',
              onPress: () => downloadAndInstallUpdate(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  const downloadAndInstallUpdate = async () => {
    try {
      await HotUpdater.downloadUpdate({
        onProgress: (progress) => {
          console.log(`Download progress: ${progress.percentage}%`);
        },
      });
      
      Alert.alert(
        'Update Downloaded',
        'The app will restart to apply the update.',
        [
          {
            text: 'Restart Now',
            onPress: () => HotUpdater.reloadApp(),
          },
        ]
      );
    } catch (error) {
      console.error('Update download failed:', error);
      Alert.alert('Update Failed', 'Please try again later.');
    }
  };

  return (
    // Your app content
    <YourAppComponent />
  );
}

export default App;
```

---

### Step 2: Advanced Integration with Wrapper

For automatic update handling:

```typescript
import { getUpdateSource, HotUpdater } from '@hot-updater/react-native';
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

const App = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Your App Content</Text>
      <Text>App Version: {HotUpdater.getAppVersion()}</Text>
      <Text>Bundle Version: {HotUpdater.getBundleId()}</Text>
      <Text>Channel: {HotUpdater.getChannel()}</Text>
      {__DEV__ && (
        <Text>Mode: Development</Text>
      )}
    </View>
  );
};

// Wrap your app with HotUpdater
export default HotUpdater.wrap({
  source: getUpdateSource('https://your-cloudfront-or-cdn-url.com/api'),
  // Optional: Custom loading component
  LoadingComponent: () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text>Checking for updates...</Text>
    </View>
  ),
})(App);
```

---

### Step 3: Multiple Environment Configuration

For apps with dev/staging/production environments:

#### Using react-native-config:

1. **Install:**
```bash
npm install react-native-config
```

2. **Create environment files:**

**.env.development:**
```env
HOT_UPDATER_URL=https://dev-updates.example.com/api
HOT_UPDATER_CHANNEL=development
```

**.env.staging:**
```env
HOT_UPDATER_URL=https://staging-updates.example.com/api
HOT_UPDATER_CHANNEL=staging
```

**.env.production:**
```env
HOT_UPDATER_URL=https://updates.example.com/api
HOT_UPDATER_CHANNEL=production
```

3. **Use in App:**
```typescript
import { getUpdateSource, HotUpdater } from '@hot-updater/react-native';
import Config from 'react-native-config';

export default HotUpdater.wrap({
  source: getUpdateSource(Config.HOT_UPDATER_URL),
  channel: Config.HOT_UPDATER_CHANNEL,
})(App);
```

---

### Step 4: Update Check Strategies

#### Strategy 1: On App Start (Recommended)
```typescript
useEffect(() => {
  checkForUpdates();
}, []);
```

#### Strategy 2: On App Resume
```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      checkForUpdates();
    }
  });

  return () => subscription.remove();
}, []);
```

#### Strategy 3: Periodic Checks
```typescript
useEffect(() => {
  // Check every 30 minutes
  const interval = setInterval(() => {
    checkForUpdates();
  }, 30 * 60 * 1000);

  return () => clearInterval(interval);
}, []);
```

#### Strategy 4: Manual Check
```typescript
const ManualUpdateButton = () => {
  return (
    <Button 
      title="Check for Updates" 
      onPress={checkForUpdates}
    />
  );
};
```

---

## Configuration Examples

### Example 1: Expo Project

```typescript
// hot-updater.config.ts
import { expo } from '@hot-updater/expo';
import { supabaseDatabase, supabaseStorage } from '@hot-updater/supabase';
import { defineConfig } from 'hot-updater';
import 'dotenv/config';

export default defineConfig({
  build: expo(),
  storage: supabaseStorage({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseAnonKey: process.env.HOT_UPDATER_SUPABASE_ANON_KEY!,
    bucketName: process.env.HOT_UPDATER_SUPABASE_BUCKET_NAME!,
  }),
  database: supabaseDatabase({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseAnonKey: process.env.HOT_UPDATER_SUPABASE_ANON_KEY!,
  }),
});
```

---

### Example 2: Re.Pack (Webpack)

```typescript
// hot-updater.config.ts
import { repack } from '@hot-updater/repack';
import { s3Storage, s3Database } from '@hot-updater/aws';
import { defineConfig } from 'hot-updater';
import 'dotenv/config';

export default defineConfig({
  build: repack({
    webpackConfigPath: './webpack.config.js',
  }),
  storage: s3Storage({
    bucketName: process.env.HOT_UPDATER_S3_BUCKET_NAME!,
    region: process.env.HOT_UPDATER_S3_REGION!,
    credentials: {
      accessKeyId: process.env.HOT_UPDATER_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.HOT_UPDATER_S3_SECRET_ACCESS_KEY!,
    },
  }),
  database: s3Database({
    bucketName: process.env.HOT_UPDATER_S3_BUCKET_NAME!,
    region: process.env.HOT_UPDATER_S3_REGION!,
    credentials: {
      accessKeyId: process.env.HOT_UPDATER_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.HOT_UPDATER_S3_SECRET_ACCESS_KEY!,
    },
  }),
});
```

---

### Example 3: Firebase

```typescript
// hot-updater.config.ts
import { bare } from '@hot-updater/bare';
import { firebaseStorage, firebaseDatabase } from '@hot-updater/firebase';
import * as admin from 'firebase-admin';
import { defineConfig } from 'hot-updater';
import 'dotenv/config';

// Initialize Firebase Admin
const credential = admin.credential.applicationDefault();

export default defineConfig({
  build: bare({ enableHermes: true }),
  storage: firebaseStorage({
    projectId: process.env.HOT_UPDATER_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.HOT_UPDATER_FIREBASE_STORAGE_BUCKET!,
    credential,
  }),
  database: firebaseDatabase({
    projectId: process.env.HOT_UPDATER_FIREBASE_PROJECT_ID!,
    credential,
  }),
});
```

---

## Deployment Workflow

### Basic Deployment

```bash
# Deploy to production for both platforms
npx hot-updater deploy -p all -c production

# Deploy to iOS only
npx hot-updater deploy -p ios -c production

# Deploy to Android only
npx hot-updater deploy -p android -c production

# Deploy to staging
npx hot-updater deploy -p all -c staging

# Deploy to development
npx hot-updater deploy -p all -c development
```

---

### Deployment with Forced Update

Force all users to update immediately:

```bash
npx hot-updater deploy -p all -c production --force
# or
npx hot-updater deploy -p all -c production -f
```

---

### Target Specific App Version

Only update apps with specific native version:

```bash
# Only update apps with version 1.2.0
npx hot-updater deploy -p android -c production -t 1.2.0

# Update multiple versions
npx hot-updater deploy -p ios -c production -t "1.2.0,1.2.1"
```

---

### Deployment Scripts (package.json)

Add these to your `package.json` for easier deployment:

```json
{
  "scripts": {
    "deploy:prod:all": "hot-updater deploy -p all -c production",
    "deploy:prod:ios": "hot-updater deploy -p ios -c production",
    "deploy:prod:android": "hot-updater deploy -p android -c production",
    "deploy:staging": "hot-updater deploy -p all -c staging",
    "deploy:dev": "hot-updater deploy -p all -c development",
    "deploy:force": "hot-updater deploy -p all -c production -f",
    "fingerprint:check": "hot-updater fingerprint",
    "fingerprint:update": "hot-updater fingerprint create",
    "channel:set:prod": "hot-updater channel set production",
    "channel:set:staging": "hot-updater channel set staging",
    "channel:set:dev": "hot-updater channel set development"
  }
}
```

**Usage:**
```bash
npm run deploy:prod:all
npm run deploy:staging
npm run deploy:force
```

---

### Complete Deployment Example

```bash
# 1. Set the channel
npx hot-updater channel set production

# 2. Update fingerprint (if native code changed)
npx hot-updater fingerprint create

# 3. Deploy to production
npx hot-updater deploy -p all -c production

# 4. Check deployment status
npx hot-updater console
```

---

## Advanced Features

### 1. Fingerprint Strategy

Fingerprints ensure compatibility between JS bundle and native code.

**Check current fingerprint:**
```bash
npx hot-updater fingerprint
```

**Update fingerprint (after native changes):**
```bash
npx hot-updater fingerprint create
```

**How it works:**
- Hash of native dependencies
- Prevents incompatible updates
- Automatic compatibility checking

---

### 2. Channel Management

Channels allow different environments:

**Set channel:**
```bash
npx hot-updater channel set production
npx hot-updater channel set staging
npx hot-updater channel set development
```

**App-side channel selection:**
```typescript
// In your App.tsx
export default HotUpdater.wrap({
  source: getUpdateSource('https://your-cdn.com/api'),
  channel: __DEV__ ? 'development' : 'production',
})(App);
```

---

### 3. Rollback

Revert to previous version:

```bash
# List available versions
npx hot-updater list

# Rollback to specific version
npx hot-updater rollback <version-id>
```

---

### 4. Custom Update UI

Create custom update experience:

```typescript
import { HotUpdater } from '@hot-updater/react-native';
import { Modal, View, Text, Button, ProgressBar } from 'react-native';

const CustomUpdateModal = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    const update = await HotUpdater.checkForUpdate();
    if (update.isAvailable) {
      setUpdateInfo(update);
      setVisible(true);
    }
  };

  const handleUpdate = async () => {
    await HotUpdater.downloadUpdate({
      onProgress: (prog) => setProgress(prog.percentage),
    });
    HotUpdater.reloadApp();
  };

  return (
    <Modal visible={visible} transparent>
      <View style={styles.modalContainer}>
        <Text>New Update Available!</Text>
        <Text>Version: {updateInfo?.version}</Text>
        <Text>Size: {updateInfo?.size}</Text>
        <ProgressBar progress={progress / 100} />
        <Button title="Update Now" onPress={handleUpdate} />
        <Button title="Later" onPress={() => setVisible(false)} />
      </View>
    </Modal>
  );
};
```

---

### 5. Analytics Integration

Track update metrics:

```typescript
import analytics from '@react-native-firebase/analytics';

const checkForUpdates = async () => {
  try {
    const update = await HotUpdater.checkForUpdate();
    
    if (update.isAvailable) {
      await analytics().logEvent('update_available', {
        version: update.version,
        current_version: HotUpdater.getBundleId(),
      });
      
      // Show update prompt
      showUpdatePrompt(update);
    } else {
      await analytics().logEvent('update_check_no_update');
    }
  } catch (error) {
    await analytics().logEvent('update_check_failed', {
      error: error.message,
    });
  }
};
```

---

## Troubleshooting

### Issue: "Module not found: @hot-updater/react-native"

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json  # or yarn.lock
npm install
# or
yarn install

# Clear Metro bundler cache
npx react-native start --reset-cache
```

---

### Issue: "Bundle download fails"

**Possible causes:**
1. Incorrect CDN/CloudFront URL
2. CORS not configured
3. Network connectivity

**Solution:**
```typescript
// Add error handling
const downloadUpdate = async () => {
  try {
    await HotUpdater.downloadUpdate({
      onError: (error) => {
        console.error('Download failed:', error);
        // Retry logic
      },
    });
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

---

### Issue: "Fingerprint mismatch"

**Cause:** Native code changed but fingerprint not updated.

**Solution:**
```bash
# Update fingerprint
npx hot-updater fingerprint create

# Redeploy
npx hot-updater deploy -p all -c production
```

---

### Issue: "Deployment fails"

**Check:**
1. AWS/Supabase credentials correct
2. `.env.hotupdater` file exists
3. Internet connection stable

**Debug:**
```bash
# Enable verbose logging
DEBUG=* npx hot-updater deploy -p all -c production
```

---

### Issue: "App crashes after update"

**Immediate fix:**
```bash
# Rollback to previous version
npx hot-updater rollback <previous-version-id>
```

**Prevention:**
- Always test in staging first
- Use fingerprint strategy
- Test on physical devices

---

### Issue: "Updates not appearing"

**Check:**
1. Correct channel set in app
2. App version matches deployment target
3. Fingerprint compatibility

**Debug in app:**
```typescript
// Add debug info
console.log('Current App Version:', HotUpdater.getAppVersion());
console.log('Current Bundle ID:', HotUpdater.getBundleId());
console.log('Current Channel:', HotUpdater.getChannel());
console.log('Fingerprint:', HotUpdater.getFingerprintHash());
```

---

## Best Practices

### 1. Development Workflow

```bash
# Step 1: Develop locally
npm start

# Step 2: Test on staging
npm run deploy:staging

# Step 3: QA approval

# Step 4: Deploy to production
npm run deploy:prod:all

# Step 5: Monitor analytics
```

---

### 2. Version Management

**Semantic Versioning:**
- Major: Breaking changes (native code)
- Minor: New features (JS only)
- Patch: Bug fixes (JS only)

**Example:**
```
1.0.0 → Native release (App Store)
1.0.1 → Hot update (bug fix)
1.0.2 → Hot update (bug fix)
1.1.0 → Hot update (new feature)
2.0.0 → Native release (breaking change)
```

---

### 3. Channel Strategy

**Recommended setup:**
```
development → Internal testing
staging → QA team
production → End users
```

**Deployment flow:**
```
dev → staging → production
 ↓       ↓          ↓
test   test    monitor
```

---

### 4. Testing Checklist

Before production deployment:

- [ ] Test on physical devices (iOS + Android)
- [ ] Test with slow network
- [ ] Test update flow
- [ ] Test rollback capability
- [ ] Verify fingerprint compatibility
- [ ] Check bundle size
- [ ] Test forced updates
- [ ] Monitor crash analytics

---

### 5. Security Best Practices

1. **Never commit `.env.hotupdater`**
```bash
echo ".env.hotupdater" >> .gitignore
```

2. **Use environment-specific credentials**
- Different AWS buckets for dev/prod
- Separate Supabase projects

3. **Enable CDN authentication**
- Signed URLs for bundle downloads
- Token-based access

4. **Monitor deployments**
- Set up alerts for failed deployments
- Track adoption rates

---

### 6. Performance Optimization

**Bundle size optimization:**
```typescript
// Enable Hermes
build: bare({ enableHermes: true })

// Use Re.Pack for code splitting
build: repack({ 
  splitChunks: true 
})
```

**Download optimization:**
```typescript
// Use CDN
source: getUpdateSource('https://cdn.example.com/api')

// Implement delta updates (if supported)
enableDeltaUpdates: true
```

---

### 7. Monitoring & Analytics

Track these metrics:
- Update check frequency
- Download success rate
- Installation success rate
- Adoption rate by version
- Average download time
- Crash rate post-update

**Example integration:**
```typescript
import analytics from './analytics';

const trackUpdate = async () => {
  const startTime = Date.now();
  
  try {
    await HotUpdater.downloadUpdate();
    
    analytics.track('update_success', {
      duration: Date.now() - startTime,
      version: update.version,
    });
  } catch (error) {
    analytics.track('update_failed', {
      error: error.message,
    });
  }
};
```

---

## Quick Reference

### Essential Commands

```bash
# Installation
npm install hot-updater --save-dev
npm install @hot-updater/react-native

# Initialization
npx hot-updater init

# Deployment
npx hot-updater deploy -p <platform> -c <channel>

# Platforms: ios, android, all
# Channels: development, staging, production

# Fingerprint
npx hot-updater fingerprint          # Check
npx hot-updater fingerprint create   # Update

# Channel
npx hot-updater channel set <channel>

# Console (web dashboard)
npx hot-updater console
```

---

### Environment Variables Template

```env
# .env.hotupdater

# Supabase
HOT_UPDATER_SUPABASE_URL=https://xxxxx.supabase.co
HOT_UPDATER_SUPABASE_ANON_KEY=eyJhbGc...
HOT_UPDATER_SUPABASE_BUCKET_NAME=hot-updater-bundles

# AWS S3
HOT_UPDATER_S3_BUCKET_NAME=your-bucket-name
HOT_UPDATER_S3_REGION=us-east-1
HOT_UPDATER_S3_ACCESS_KEY_ID=AKIA...
HOT_UPDATER_S3_SECRET_ACCESS_KEY=...

# Cloudflare
HOT_UPDATER_CLOUDFLARE_R2_BUCKET_NAME=hot-updater-bundles
HOT_UPDATER_CLOUDFLARE_D1_DATABASE_ID=xxxxx
HOT_UPDATER_CLOUDFLARE_ACCOUNT_ID=xxxxx
HOT_UPDATER_CLOUDFLARE_API_TOKEN=xxxxx
```

---

### React Native Integration Template

```typescript
// App.tsx
import React, { useEffect } from 'react';
import { HotUpdater, getUpdateSource } from '@hot-updater/react-native';

const App = () => {
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    const update = await HotUpdater.checkForUpdate();
    if (update.isAvailable) {
      // Handle update
    }
  };

  return (
    // Your app
  );
};

export default HotUpdater.wrap({
  source: getUpdateSource('YOUR_CDN_URL'),
})(App);
```

---

## Resources

### Official Documentation
- **Hot Updater Docs:** https://hot-updater.dev
- **GitHub:** https://github.com/gronxb/hot-updater
- **npm Package:** https://npmjs.com/package/@hot-updater/react-native

### Storage Provider Docs
- **AWS S3:** https://aws.amazon.com/s3/
- **Supabase:** https://supabase.com/docs
- **Cloudflare R2:** https://developers.cloudflare.com/r2/

### Related Tools
- **React Native:** https://reactnative.dev
- **Expo:** https://expo.dev
- **Re.Pack:** https://re-pack.dev

---

## Support

Need help?
1. Check this guide first
2. Review official documentation
3. Search GitHub issues
4. Ask in React Native community
5. Open a GitHub issue

---

## Summary

**What you've learned:**
- ✅ Hot Updater installation and setup
- ✅ Self-hosting with AWS, Supabase, or Cloudflare
- ✅ React Native client integration
- ✅ Deployment workflows
- ✅ Channel management
- ✅ Troubleshooting common issues
- ✅ Best practices for production

**Next steps:**
1. Choose your storage provider
2. Run `npx hot-updater init`
3. Integrate in React Native app
4. Deploy to staging
5. Test thoroughly
6. Deploy to production!

---

**Document Version:** 1.0.0  
**Last Updated:** November 13, 2025  
**License:** MIT

---

Made with ❤️ for the React Native community

**Ready to deploy? Let's go!** 🚀
