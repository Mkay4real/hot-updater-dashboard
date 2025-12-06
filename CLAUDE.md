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

The database layer (`lib/db.ts`) uses a **provider abstraction pattern** supporting three backends:
- **Supabase** (default) - Recommended for quick setup
- **PostgreSQL** - Direct connection for self-hosted databases
- **Cloudflare D1** - Serverless SQLite for edge deployments

Switch providers via the `DB_PROVIDER` environment variable. The database functions (`getDeployments`, `getBundles`, `getStats`, `rollbackDeployment`) abstract away provider differences and return consistent data structures. Mock data is provided as fallback for development without database setup.

### API Route Pattern

All API routes follow a consistent pattern:
1. Import the relevant database function from `@/lib/db`
2. Execute the function in a try-catch block
3. Return JSON response with NextResponse
4. Handle errors with appropriate status codes (500 for server errors)

The `/api/deploy` endpoint is unique - it executes shell commands using Node's `child_process` to run `npx hot-updater deploy` commands.

### Database Schema

Four main tables with specific relationships:

**deployments** - Core deployment history
- Tracks version, platform (ios/android/all), channel, status, downloads
- Links to bundles via version + platform + channel

**bundles** - Bundle metadata and storage info
- Stores bundle size, fingerprint, active status
- One bundle can have multiple deployments

**app_users** - User tracking for analytics
- Tracks device_id, platform, current bundle_version
- Used to calculate adoption rates and active users

**update_stats** - Aggregated analytics (daily)
- Pre-calculated metrics for dashboard performance
- Contains adoption_rate, total_checks, successful/failed updates

See the SQL schema at the bottom of [lib/db.ts](lib/db.ts:322-380) or in README.md.

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

For Supabase: Run the SQL script in [lib/db.ts:322-380](lib/db.ts:322-380) or from README.md in the Supabase SQL editor to create required tables and indexes.

For PostgreSQL: Execute the same SQL script directly on your PostgreSQL instance.

## Common Development Workflows

**Initial Setup:**
1. Clone or download this repository
2. Run `npm install` to install dependencies
3. Copy `env.example` to `.env.local` and configure with your database credentials
4. Set up database tables using the SQL script in lib/db.ts or README.md
5. Start dev server with `npm run dev`
6. Visit http://localhost:3000

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
