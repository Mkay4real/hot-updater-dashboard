# Deployment Architecture Guide

## Overview

This document outlines how to architect the Hot Updater Dashboard for **multi-project usage** without requiring users to clone/fork the repository repeatedly, while ensuring everyone benefits from upstream fixes and improvements.

---

## Architecture Option 1: Multi-Tenant SaaS (RECOMMENDED for Hosted Tier)

### Concept
**One deployment serves multiple organizations/projects.** Users sign up, connect their Hot Updater credentials, and you manage everything centrally.

### Architecture

```
┌─────────────────────────────────────────────┐
│         your-dashboard.com                  │
│  (Single Next.js Deployment - Vercel/AWS)  │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
   │ User A │  │ User B │  │ User C │
   │ Org 1  │  │ Org 2  │  │ Org 3  │
   └────┬───┘  └────┬───┘  └────┬───┘
        │           │           │
   ┌────▼───────────▼───────────▼────┐
   │    Credentials Storage DB       │
   │  (Encrypted Hot Updater creds)  │
   └─────────────────────────────────┘
        │           │           │
   ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
   │ User A │  │ User B │  │ User C │
   │Supabase│  │  AWS   │  │Firebase│
   └────────┘  └────────┘  └────────┘
```

### Implementation

#### Step 1: Add Multi-Tenancy Schema

Create a new database for dashboard users (separate from Hot Updater bundles):

```typescript
// lib/dashboard-db.ts
import { createClient } from '@supabase/supabase-js';

// Your own Supabase instance for dashboard users
const dashboardDb = createClient(
  process.env.DASHBOARD_SUPABASE_URL!,
  process.env.DASHBOARD_SUPABASE_ANON_KEY!
);

/**
 * Schema:
 *
 * users
 * - id: uuid (PK)
 * - email: text
 * - created_at: timestamp
 *
 * organizations
 * - id: uuid (PK)
 * - name: text
 * - owner_id: uuid (FK -> users.id)
 * - created_at: timestamp
 *
 * projects
 * - id: uuid (PK)
 * - organization_id: uuid (FK -> organizations.id)
 * - name: text
 * - db_provider: text ('supabase', 'aws', 'postgres')
 * - credentials: jsonb (encrypted)
 * - hot_updater_project_path: text (optional for deployments)
 * - created_at: timestamp
 *
 * organization_members
 * - organization_id: uuid (FK -> organizations.id)
 * - user_id: uuid (FK -> users.id)
 * - role: text ('owner', 'admin', 'member', 'viewer')
 */

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  db_provider: 'supabase' | 'aws' | 'aws-rds' | 'postgres' | 'cloudflare-d1' | 'firebase';
  credentials: {
    // For Supabase
    supabase_url?: string;
    supabase_anon_key?: string;

    // For AWS S3
    s3_bucket_name?: string;
    s3_region?: string;
    s3_access_key_id?: string;
    s3_secret_access_key?: string;
    cloudfront_distribution_id?: string;

    // For PostgreSQL
    database_url?: string;

    // For Cloudflare D1
    d1_database_id?: string;
    d1_api_token?: string;

    // For Firebase
    firebase_credentials?: object;
  };
  hot_updater_project_path?: string;
  created_at: string;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const { data, error } = await dashboardDb
    .from('projects')
    .select(`
      *,
      organizations!inner (
        organization_members!inner (
          user_id
        )
      )
    `)
    .eq('organizations.organization_members.user_id', userId);

  if (error) throw error;
  return data as Project[];
}

export async function getProject(projectId: string, userId: string): Promise<Project | null> {
  // Verify user has access to this project
  const { data, error } = await dashboardDb
    .from('projects')
    .select(`
      *,
      organizations!inner (
        organization_members!inner (
          user_id
        )
      )
    `)
    .eq('id', projectId)
    .eq('organizations.organization_members.user_id', userId)
    .single();

  if (error) return null;
  return data as Project;
}

export async function createProject(
  organizationId: string,
  name: string,
  dbProvider: Project['db_provider'],
  credentials: Project['credentials']
): Promise<Project> {
  const { data, error } = await dashboardDb
    .from('projects')
    .insert({
      organization_id: organizationId,
      name,
      db_provider: dbProvider,
      credentials, // Should be encrypted before storing
    })
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}
```

#### Step 2: Dynamic Database Connection

Modify `lib/db.ts` to accept project credentials:

```typescript
// lib/db.ts - Add dynamic connection
export function createProjectConnection(project: Project) {
  if (project.db_provider === 'supabase') {
    const supabase = createClient(
      project.credentials.supabase_url!,
      project.credentials.supabase_anon_key!
    );

    return {
      getDeployments: () => getDeploymentsSupabase(supabase),
      getBundles: () => getBundlesSupabase(supabase),
      getStats: () => getStatsSupabase(supabase),
      // ... other methods
    };
  }

  if (project.db_provider === 'aws') {
    const s3Client = new S3Client({
      region: project.credentials.s3_region!,
      credentials: {
        accessKeyId: project.credentials.s3_access_key_id!,
        secretAccessKey: project.credentials.s3_secret_access_key!,
      },
    });

    return {
      getDeployments: () => getDeploymentsAWS(s3Client, project.credentials.s3_bucket_name!),
      getBundles: () => getBundlesAWS(s3Client, project.credentials.s3_bucket_name!),
      getStats: () => getStatsAWS(s3Client, project.credentials.s3_bucket_name!),
      // ... other methods
    };
  }

  // ... other providers
}
```

#### Step 3: Update API Routes to Accept Project ID

```typescript
// app/api/deployments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/dashboard-db';
import { createProjectConnection } from '@/lib/db';
import { auth } from '@clerk/nextjs'; // or your auth provider

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project ID from query params
    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify user has access to this project
    const project = await getProject(projectId, userId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Create dynamic connection using project credentials
    const connection = createProjectConnection(project);
    const deployments = await connection.getDeployments();

    return NextResponse.json(deployments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### Step 4: Add Project Selector to Dashboard

```typescript
// app/page.tsx - Add project selector
'use client';

import { useState, useEffect } from 'react';
import { getUserProjects, Project } from '@/lib/dashboard-db';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState([]);

  useEffect(() => {
    // Load user's projects
    getUserProjects(currentUserId).then(setProjects);
  }, []);

  useEffect(() => {
    if (!selectedProject) return;

    // Fetch data for selected project
    fetch(`/api/deployments?projectId=${selectedProject.id}`)
      .then(res => res.json())
      .then(setDeployments);
  }, [selectedProject]);

  return (
    <div>
      {/* Project Selector */}
      <select onChange={(e) => {
        const project = projects.find(p => p.id === e.target.value);
        setSelectedProject(project || null);
      }}>
        <option value="">Select Project</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

      {/* Rest of dashboard using selectedProject data */}
      {selectedProject && (
        <div>
          <h2>{selectedProject.name}</h2>
          {/* Deployments, bundles, etc. */}
        </div>
      )}
    </div>
  );
}
```

### Benefits
- ✅ Single codebase - all users get instant updates
- ✅ Zero deployment effort for users
- ✅ Centralized maintenance
- ✅ Easy to add billing/metering
- ✅ Full control over features

### Challenges
- ⚠️ Requires authentication system (Clerk, Auth0, NextAuth)
- ⚠️ Must securely encrypt credentials
- ⚠️ Need to handle rate limiting per project
- ⚠️ Infrastructure costs scale with users

---

## Architecture Option 2: Vercel/Railway One-Click Deploy (RECOMMENDED for Open Source)

### Concept
Users deploy their own instance with one click, but can **sync upstream updates** from your repository.

### Implementation

#### Step 1: Create Deploy Button

Add to README.md:

```markdown
## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/hot-updater-dashboard&env=DB_PROVIDER,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)
```

#### Step 2: Create Vercel Configuration

```json
// vercel.json
{
  "env": {
    "DB_PROVIDER": {
      "description": "Database provider (supabase, aws, postgres)",
      "default": "supabase"
    },
    "NEXT_PUBLIC_SUPABASE_URL": {
      "description": "Your Supabase project URL (if using Supabase)"
    },
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": {
      "description": "Your Supabase anon key (if using Supabase)"
    },
    "HOT_UPDATER_S3_BUCKET_NAME": {
      "description": "S3 bucket name (if using AWS)"
    }
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

#### Step 3: Document Upstream Sync

Add to CONTRIBUTING.md:

```markdown
## Syncing with Upstream Updates

To get the latest improvements from the main repository:

### Method 1: GitHub Web Interface (Easiest)
1. Go to your forked repository on GitHub
2. Click "Sync fork" → "Update branch"
3. Vercel will auto-deploy the updates

### Method 2: Command Line
```bash
# Add upstream remote (once)
git remote add upstream https://github.com/original/hot-updater-dashboard.git

# Fetch and merge updates
git fetch upstream
git merge upstream/main

# Push to your repo (triggers Vercel deploy)
git push origin main
```

### Method 3: Automated (GitHub Actions)
Create `.github/workflows/sync-upstream.yml`:

```yaml
name: Sync Upstream
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Sync upstream changes
        run: |
          git remote add upstream https://github.com/original/hot-updater-dashboard.git
          git fetch upstream
          git merge upstream/main --no-edit
          git push
```
```

### Benefits
- ✅ Users control their deployment
- ✅ No vendor lock-in
- ✅ Can customize if needed
- ✅ Easy upstream sync
- ✅ Zero hosting cost for you

### Challenges
- ⚠️ Users must manually sync updates
- ⚠️ Each instance deployed separately
- ⚠️ Support burden if users customize code

---

## Architecture Option 3: Docker Container

### Concept
Package as Docker image, users pull and run. Updates = pull new image.

### Implementation

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Usage:**

```bash
# Pull and run
docker pull yourdockerhub/hot-updater-dashboard:latest
docker run -p 3000:3000 \
  -e DB_PROVIDER=supabase \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  yourdockerhub/hot-updater-dashboard:latest
```

Or with docker-compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  dashboard:
    image: yourdockerhub/hot-updater-dashboard:latest
    ports:
      - "3000:3000"
    environment:
      - DB_PROVIDER=${DB_PROVIDER}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      # Add other env vars as needed
    env_file:
      - .env.local
    restart: unless-stopped
```

**To update:**

```bash
docker pull yourdockerhub/hot-updater-dashboard:latest
docker-compose up -d
```

### Benefits
- ✅ Consistent environment
- ✅ Easy updates (pull new image)
- ✅ Works anywhere (AWS, GCP, self-hosted)
- ✅ Version control via tags

### Challenges
- ⚠️ Requires Docker knowledge
- ⚠️ Image size considerations
- ⚠️ Still need to manage deployments

---

## Recommended Hybrid Approach

**For open source users:**
1. **Vercel One-Click Deploy** - Easiest entry
2. **Docker Image** - For self-hosters
3. **Upstream sync documentation** - Keep users updated

**For paid/hosted tier:**
1. **Multi-tenant SaaS** - You host everything
2. **No deployment required** - Sign up → connect credentials → done

## Implementation Roadmap

### Phase 1: Open Source Foundation (Week 1-2)
- [ ] Add Vercel deploy button to README
- [ ] Create `vercel.json` with env configuration
- [ ] Write upstream sync documentation
- [ ] Test one-click deploy flow

### Phase 2: Docker Support (Week 3)
- [ ] Create optimized Dockerfile
- [ ] Set up Docker Hub automated builds
- [ ] Write docker-compose examples
- [ ] Test deployment on Railway/Render

### Phase 3: Multi-Tenant SaaS (Week 4-8)
- [ ] Design multi-tenancy schema
- [ ] Implement authentication (Clerk recommended)
- [ ] Add project management UI
- [ ] Encrypt credentials at rest
- [ ] Add project selector to dashboard
- [ ] Update all API routes for multi-tenancy
- [ ] Add billing integration (Stripe)

### Phase 4: Enterprise Features (Month 3+)
- [ ] Role-based access control (RBAC)
- [ ] Audit logs
- [ ] SSO support (SAML/OIDC)
- [ ] White-label customization
- [ ] Advanced analytics

---

## Security Considerations

### Credential Encryption

```typescript
// lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

Usage:

```typescript
// When saving project credentials
const encryptedCreds = encrypt(JSON.stringify(project.credentials));
await dashboardDb.from('projects').insert({ ...project, credentials: encryptedCreds });

// When retrieving project credentials
const project = await dashboardDb.from('projects').select('*').eq('id', projectId).single();
const credentials = JSON.parse(decrypt(project.data.credentials));
```

---

## Conclusion

**Recommended Path:**

1. **Start with Vercel One-Click Deploy** for open source adoption
2. **Add Docker support** for self-hosters
3. **Build multi-tenant SaaS** for hosted tier
4. **Maintain single codebase** - open source and SaaS use same code

This gives you:
- Maximum reach (anyone can self-host)
- Easy monetization (hosted tier for convenience)
- Single maintenance burden (one codebase)
- Community benefits (all improvements shared)

**Next Steps:**
1. Add Vercel deploy button (30 minutes)
2. Test deployment flow
3. Write sync documentation
4. Launch open source version
5. Validate demand before building multi-tenant SaaS
