# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **production-ready Next.js 14 dashboard** for managing Hot Updater (OTA update system) deployments for React Native applications. The dashboard provides a visual interface to:
- Track and manage deployments across iOS and Android platforms
- View bundle information and download statistics
- Deploy updates to different channels (dev/staging/production)
- Rollback to previous versions
- Monitor analytics and adoption rates

**Important**: This repository IS a complete, production-ready Next.js application with proper structure, configuration, and security features.

## Development Commands

**Note:** This project uses **yarn** as the package manager. Always use `yarn` for installing dependencies.

```bash
# Install dependencies
yarn

# Development server (http://localhost:3000)
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linter
yarn lint
```

## Project Architecture

### File Structure

The repository is properly structured as a complete Next.js application:

```
hot-updater-dashboard/
├── app/
│   ├── page.tsx                          # Main dashboard component
│   ├── layout.tsx                        # Root layout
│   ├── globals.css                       # Global styles
│   └── api/
│       ├── deployments/route.ts          # GET deployments list
│       ├── bundles/route.ts              # GET bundles list
│       ├── stats/route.ts                # GET dashboard statistics
│       ├── deploy/route.ts               # POST deploy new version
│       └── rollback/[id]/route.ts        # POST rollback to version
├── lib/
│   └── db.ts                             # Database utilities
├── public/                               # Static assets
├── .gitignore                            # Git ignore rules
├── .env.local                            # Environment variables (create from env.example)
├── env.example                           # Environment template
├── next.config.js                        # Next.js configuration
├── tailwind.config.ts                    # Tailwind configuration
├── tsconfig.json                         # TypeScript configuration
├── postcss.config.js                     # PostCSS configuration
├── package.json                          # Dependencies
├── CLAUDE.md                             # This file
└── README.md                             # Main documentation
```

### Database Layer Architecture

The database layer ([lib/db.ts](lib/db.ts)) supports multiple database providers for flexibility:

**Officially Supported Providers** (by Hot Updater):
- **Supabase** - Easiest setup, includes both storage and database
- **AWS S3** - Hot Updater's official AWS provider using s3Storage + s3Database (metadata stored in S3)
- **PostgreSQL** - Direct PostgreSQL connection
- **Cloudflare D1** - Edge database for global performance
- **Firebase** - Firebase Realtime Database

**Note:** AWS S3 provider requires `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` (already installed). CloudFront CDN is optional for improved global performance.

The database layer integrates with **Hot Updater's existing schema**. Hot Updater CLI automatically creates the required database tables when you run `npx hot-updater init` in your React Native project.

**Important**: This dashboard does NOT create its own tables. It reads from the `bundles` table that Hot Updater creates and manages. The database functions (`getDeployments`, `getBundles`, `getStats`, `rollbackDeployment`, `updateBundle`, `deleteBundle`, `promoteBundle`) transform Hot Updater's schema into the dashboard's display format. Mock data is provided as fallback for development without database setup.

### API Route Pattern

All API routes follow a consistent pattern:
1. Import the relevant database function from `@/lib/db`
2. Execute the function in a try-catch block
3. Return JSON response with NextResponse
4. Handle errors with appropriate status codes (500 for server errors)

The `/api/deploy` endpoint is unique - it executes shell commands using Node's `child_process` to run `npx hot-updater deploy` commands.

### Database Schema

This dashboard integrates with Hot Updater's existing database schema:

**bundles** - Hot Updater's bundle metadata table (created by hot-updater CLI)
- `id`: UUID (UUIDv7 with embedded timestamp)
- `platform`: 'ios' or 'android'
- `channel`: Deployment channel ('development', 'staging', 'production')
- `enabled`: Boolean flag indicating if bundle is active
- `file_hash`: SHA256 hash of the bundle file
- `git_commit_hash`: Git commit when bundle was created
- `message`: Deployment message/notes
- `metadata`: JSONB field containing app_version and other data
- `storage_uri`: Location of bundle file in Supabase Storage
- `fingerprint_hash`: Unique fingerprint for bundle identification
- `target_app_version`: Specific app version this bundle targets (nullable)
- `should_force_update`: Whether to force update on clients

The dashboard transforms this data into a user-friendly format for viewing deployments, bundles, and analytics.

See the full schema documentation at the bottom of [lib/db.ts](lib/db.ts:308-341).

### Component Architecture

The main dashboard component ([app/page.tsx](app/page.tsx)) is a client-side React component that:
- Uses React hooks for state management (no external state library)
- Fetches data from API routes on mount and refresh
- Implements tab navigation for different views (Deployments, Bundles, Analytics, Settings)
- Handles deployment and rollback actions via POST requests to API routes
- Uses Lucide React icons for consistent iconography
- Styled with Tailwind CSS utility classes

The component is approximately 500 lines and self-contained with no child components.

## Environment Configuration

Copy `env.example` to `.env.local` and configure based on your chosen database provider:

**Supabase (Recommended for quick start):**
```env
DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**AWS S3 (Hot Updater's Official AWS Provider):**
```env
DB_PROVIDER=aws

# S3 Configuration (uses Hot Updater's s3Database + s3Storage)
# These should match your hot-updater.config.ts settings
HOT_UPDATER_S3_BUCKET_NAME=your-bucket-name
HOT_UPDATER_S3_REGION=us-east-1
HOT_UPDATER_S3_ACCESS_KEY_ID=AKIA...
HOT_UPDATER_S3_SECRET_ACCESS_KEY=your-secret-key

# Optional: CloudFront Distribution ID
HOT_UPDATER_CLOUDFRONT_DISTRIBUTION_ID=E34WBFNB217Z3E

HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**PostgreSQL:**
```env
DB_PROVIDER=postgres
DATABASE_URL=postgresql://username:password@host:5432/database
HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**DynamoDB (⚠️ EXPERIMENTAL - Not officially supported by Hot Updater):**
```env
DB_PROVIDER=dynamodb
AWS_DYNAMODB_REGION=us-east-1
AWS_DYNAMODB_TABLE_NAME=hot-updater-bundles
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```
> **Warning**: DynamoDB support is experimental and not part of Hot Updater's official plugins. You must manually create and manage the DynamoDB table with the correct schema. Consider using an officially supported provider for production.

**Other providers:** Set `DB_PROVIDER=postgres` or `DB_PROVIDER=cloudflare-d1` and configure the corresponding connection variables in `.env.local`.

## Key Integration Points

### Hot Updater Integration

The dashboard executes Hot Updater CLI commands via the `/api/deploy` endpoint:
```typescript
// Deployment command format
npx hot-updater deploy -p ${platform} -c ${channel}
```

The `HOT_UPDATER_PROJECT_PATH` environment variable must point to your React Native project containing the `hot-updater.config.ts` file.

### Database Setup

**Important**: This dashboard uses Hot Updater's existing database schema. You don't need to create any tables manually.

1. In your React Native project, run `npx hot-updater init` and select your preferred provider
2. Hot Updater will automatically create the required `bundles` table and storage bucket
3. Use the same credentials in this dashboard's `.env.local` file with matching `DB_PROVIDER`
4. The dashboard will automatically read from Hot Updater's `bundles` table

**Provider-Specific Setup:**
- **Supabase**: Use the same project URL and anon key from Hot Updater init
- **AWS S3**: Use the SAME credentials from your React Native project's `hot-updater.config.ts`. The dashboard reads metadata from S3 where Hot Updater stores it.
- **PostgreSQL**: Use Hot Updater's PostgreSQL plugin configuration
- **Cloudflare D1**: Use the same database ID and API token from Hot Updater init
- **Firebase**: Use Firebase Realtime Database credentials from Hot Updater init

See [lib/db.ts](lib/db.ts) for the complete Hot Updater schema reference and provider implementations.

## Common Development Workflows

**Initial Setup:**
1. Set up Hot Updater in your React Native project first:
   - Run `npx hot-updater init` in your RN project
   - Select your preferred provider (Supabase, AWS, etc.)
   - This creates the database tables and storage bucket
2. Clone or download this dashboard repository
3. Run `yarn` to install dependencies
4. Copy `env.example` to `.env.local`
5. Configure `.env.local`:
   - Set `DB_PROVIDER` to match your Hot Updater setup
   - Add the SAME credentials you used in Hot Updater
   - Set `HOT_UPDATER_PROJECT_PATH` to your React Native project path
6. Start dev server with `yarn dev`
7. Visit http://localhost:3000

**Note:** AWS S3 dependencies are already installed. No additional packages needed for the official Hot Updater AWS provider.

**AWS S3 Features Enabled:**
- ✅ Automatic bundle size fetching from S3
- ✅ Presigned download URL generation
- ✅ Support for both `s3://` and `https://` storage URI formats

**Adding New API Endpoints:**
- Create new folder under `app/api/` with a `route.ts` file
- Import database functions from `@/lib/db`
- Follow the existing error handling pattern
- Update the dashboard component to call the new endpoint

**Modifying Database Queries:**
- Add new functions to `lib/db.ts`
- Maintain the provider abstraction pattern (check `DB_PROVIDER`)
- Always provide mock data fallback for development
- Update corresponding API routes to use new functions
