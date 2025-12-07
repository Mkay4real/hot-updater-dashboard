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

```bash
# Development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
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
├── docs/
│   ├── FILE-PLACEMENT-GUIDE.md           # Visual guide (reference)
│   ├── QUICKSTART.md                     # 15-minute setup guide
│   └── REACT-NATIVE-INTEGRATION-GUIDE.md # RN integration guide
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

The database layer (`lib/db.ts`) integrates with **Hot Updater's existing Supabase schema**. Hot Updater CLI automatically creates the required database tables when you run `npx hot-updater init` in your React Native project.

**Important**: This dashboard does NOT create its own tables. It reads from the `bundles` table that Hot Updater creates and manages. The database functions (`getDeployments`, `getBundles`, `getStats`, `rollbackDeployment`) transform Hot Updater's schema into the dashboard's display format. Mock data is provided as fallback for development without database setup.

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

Copy `env.example` to `.env.local` and configure:

**Required for Supabase:**
```env
DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
HOT_UPDATER_PROJECT_PATH=/path/to/react-native-project
```

**Alternative providers:** Set `DB_PROVIDER=postgres` or `DB_PROVIDER=cloudflare-d1` and configure the corresponding connection variables.

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

1. In your React Native project, run `npx hot-updater init` and select Supabase as your provider
2. Hot Updater will automatically create the required `bundles` table and storage bucket in your Supabase project
3. Use the same Supabase credentials (URL and anon key) in this dashboard's `.env.local` file
4. The dashboard will automatically read from Hot Updater's `bundles` table

See [lib/db.ts:308-341](lib/db.ts:308-341) for the complete Hot Updater schema reference.

## Common Development Workflows

**Initial Setup:**
1. Set up Hot Updater in your React Native project first:
   - Run `npx hot-updater init` in your RN project
   - Select Supabase as your provider
   - This creates the database tables and storage bucket
2. Clone or download this dashboard repository
3. Run `npm install` to install dependencies
4. Copy `env.example` to `.env.local`
5. Configure `.env.local` with the SAME Supabase credentials from step 1
6. Set `HOT_UPDATER_PROJECT_PATH` to your React Native project path
7. Start dev server with `npm run dev`
8. Visit http://localhost:3000

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
