# Environment Variables Reference

Complete reference of all environment variables for each database provider.

## 🔒 Security: Client vs Server Side

### Client-Side Variables (Exposed to Browser)
These variables are prefixed with `NEXT_PUBLIC_` and are safe to expose:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3000
```

**Note**: Supabase anon key is designed to be public. Data security is handled by Row Level Security (RLS) policies in Supabase.

### Server-Side Variables (Private)
All other variables remain server-side only and are NEVER exposed to the browser:
- AWS credentials
- Database passwords
- API tokens
- All non-`NEXT_PUBLIC_` prefixed variables

---

## 📋 Required Variables by Provider

### 1. Supabase (✅ Officially Supported)

**Status**: Easiest setup, recommended for quick start

**Required Variables:**
```env
DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**NPM Packages**: Already included
```bash
npm install @supabase/supabase-js
```

**Setup Steps:**
1. Run `npx hot-updater init` in your React Native project
2. Select Supabase
3. Use the same credentials in this dashboard

---

### 2. AWS RDS + S3 (✅ Officially Supported)

**Status**: Production-ready, full AWS integration

**Architecture:**
- **RDS (PostgreSQL)**: Stores bundle metadata
- **S3**: Stores bundle files (.zip)
- **Lambda@Edge**: Optional for edge delivery

**Required Variables:**
```env
DB_PROVIDER=aws-rds

# Database (RDS PostgreSQL)
AWS_RDS_HOST=your-rds-instance.region.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=hotupdater
AWS_RDS_USER=postgres
AWS_RDS_PASSWORD=your-password
AWS_RDS_SSL=true

# Storage (S3)
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=hot-updater-bundles

# Shared AWS Credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key

HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**NPM Packages:**
```bash
npm install pg @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**IAM Permissions Required:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::hot-updater-bundles/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:Connect"
      ],
      "Resource": "arn:aws:rds:region:account-id:db:hotupdater"
    }
  ]
}
```

**Features Enabled:**
- ✅ Real bundle sizes from S3
- ✅ Presigned download URLs
- ✅ Supports `s3://` and `https://` URIs

---

### 3. PostgreSQL Direct (❌ NOT IMPLEMENTED)

**Status**: Documented but not implemented in lib/db.ts

**Would Require:**
```env
DB_PROVIDER=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/hotupdater
HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**Action Needed**: Implement PostgreSQL provider in [lib/db.ts](lib/db.ts)

---

### 4. Cloudflare D1 (❌ NOT IMPLEMENTED)

**Status**: Variables documented, but no implementation

**Would Require:**
```env
DB_PROVIDER=cloudflare-d1
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_D1_DATABASE_ID=your-database-id
HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**Action Needed**: Implement Cloudflare D1 provider in [lib/db.ts](lib/db.ts)

---

### 5. Firebase (❌ NOT IMPLEMENTED)

**Status**: Mentioned in docs but completely missing

**Would Require:**
```env
DB_PROVIDER=firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json
# OR
FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}
HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**Action Needed**:
1. Add Firebase variables to env.example
2. Implement Firebase provider in [lib/db.ts](lib/db.ts)

---

### 6. DynamoDB (⚠️ EXPERIMENTAL - Not Officially Supported)

**Status**: Custom implementation, use with caution

**Required Variables:**
```env
DB_PROVIDER=dynamodb
AWS_DYNAMODB_REGION=us-east-1
AWS_DYNAMODB_TABLE_NAME=hot-updater-bundles

# Shared AWS Credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key

HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**NPM Packages:**
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

**Important Notes:**
- ⚠️ NOT officially supported by Hot Updater
- Requires manual table creation
- You must manage schema yourself
- No automatic setup with `npx hot-updater init`

---

## 🎯 Common Variables (All Providers)

These variables work with all providers:

```env
# Required
DB_PROVIDER=supabase|aws-rds|postgres|cloudflare-d1|firebase|dynamodb
HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project

# Optional
USE_MOCK_DATA=false
LOG_LEVEL=info
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com

# Optional: Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK

# Optional: Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

---

## ✅ Implementation Status Summary

| Provider | env.example | lib/db.ts | Status |
|----------|-------------|-----------|--------|
| **Supabase** | ✅ | ✅ | **Working** |
| **AWS RDS + S3** | ✅ | ✅ | **Working** |
| **DynamoDB** | ✅ | ✅ | **Working (Experimental)** |
| **PostgreSQL** | ✅ | ❌ | **NOT WORKING** |
| **Cloudflare D1** | ✅ | ❌ | **NOT WORKING** |
| **Firebase** | ❌ | ❌ | **NOT WORKING** |

---

## 🚀 Quick Start by Provider

### For Supabase:
1. Copy env.example to .env.local
2. Set `DB_PROVIDER=supabase`
3. Add your Supabase URL and anon key
4. Run `npm run dev`

### For AWS RDS + S3:
1. Copy env.example to .env.local
2. Set `DB_PROVIDER=aws-rds`
3. Add RDS connection details
4. Add S3 bucket name and AWS credentials
5. Install: `npm install pg @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
6. Run `npm run dev`

### For Other Providers:
Currently not implemented. See "Action Needed" sections above.

---

## 🔍 Verification Checklist

Before starting the dashboard, verify:

- [ ] `.env.local` file exists (copied from env.example)
- [ ] `DB_PROVIDER` is set to a valid provider
- [ ] All required variables for chosen provider are filled in
- [ ] No `NEXT_PUBLIC_` prefix on sensitive credentials
- [ ] Required npm packages are installed
- [ ] Hot Updater is initialized in React Native project
- [ ] `HOT_UPDATER_PROJECT_PATH` points to correct directory

---

## 📝 Notes

1. **Never commit `.env.local`** to version control
2. **Restart dev server** after changing environment variables
3. **Check console logs** for database connection issues
4. **Use mock data** for testing without database setup (set `USE_MOCK_DATA=true`)
5. **AWS credentials** are shared between S3 and DynamoDB providers
6. **Lambda@Edge** doesn't require dashboard configuration (it's for serving bundles)

---

Last Updated: December 2025
