# Production Deployment Guide

This guide covers deploying the Hot Updater Dashboard to production with secure authentication for authorized stakeholders.

## Overview

**Stack:**
- **Hosting**: Vercel (recommended) or Railway
- **Authentication**: Clerk (easiest) or NextAuth.js
- **Access Control**: Email allowlist + role-based access
- **Database**: Use your existing Hot Updater provider (Supabase/AWS S3/PostgreSQL)

## Option 1: Clerk (Recommended - Easiest Setup)

Clerk provides enterprise-grade authentication with minimal code. Perfect for internal dashboards.

### 1. Install Clerk

```bash
yarn add @clerk/nextjs
```

### 2. Get Clerk API Keys

1. Sign up at [clerk.com](https://clerk.com) (free tier: 10k monthly active users)
2. Create a new application
3. Copy your API keys from the dashboard
4. Add to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Optional: Restrict to specific email domains
CLERK_ALLOWED_DOMAINS=yourcompany.com,partner.com

# Optional: Email allowlist (comma-separated)
AUTHORIZED_EMAILS=john@company.com,jane@company.com,stakeholder@partner.com
```

### 3. Wrap Your App with Clerk Provider

Update `app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 4. Create Sign-In Page

Create `app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

### 5. Protect Dashboard Routes

Create `middleware.ts` in project root:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()

    // Optional: Check email allowlist
    const user = auth().user
    const allowedEmails = process.env.AUTHORIZED_EMAILS?.split(',') || []

    if (allowedEmails.length > 0 && user?.primaryEmailAddress?.emailAddress) {
      if (!allowedEmails.includes(user.primaryEmailAddress.emailAddress)) {
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 403 }
        )
      }
    }
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

### 6. Add User Info to Dashboard

Update `app/page.tsx` to show current user:

```typescript
import { UserButton } from "@clerk/nextjs";

export default function Dashboard() {
  return (
    <div>
      <header className="flex justify-between items-center p-4">
        <h1>Hot Updater Dashboard</h1>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>
      {/* Rest of your dashboard */}
    </div>
  )
}
```

### 7. Clerk Dashboard Configuration

In your Clerk dashboard:

1. **Enable email verification** (Settings > Email & Phone)
2. **Disable sign-ups** if you want invite-only (Settings > Sign-up)
3. **Set allowed email domains** (Settings > Restrictions)
4. **Invite team members** (Users > Invite)

---

## Option 2: NextAuth.js (More Flexible)

NextAuth.js gives you more control but requires more setup.

### 1. Install NextAuth

```bash
yarn add next-auth @auth/core
```

### 2. Configure NextAuth

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"

const allowedEmails = process.env.AUTHORIZED_EMAILS?.split(',') || []

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Or use Email (magic link)
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Check if user is authorized
      if (allowedEmails.length > 0 && user.email) {
        return allowedEmails.includes(user.email)
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
})

export { handler as GET, handler as POST }
```

### 3. Add Environment Variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Or Email provider
EMAIL_SERVER=smtp://user:pass@smtp.gmail.com:587
EMAIL_FROM=noreply@yourcompany.com

# Authorized users
AUTHORIZED_EMAILS=john@company.com,jane@company.com
```

### 4. Protect Routes with Middleware

Create `middleware.ts`:

```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized({ token }) {
      return !!token
    },
  },
})

export const config = {
  matcher: ['/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)']
}
```

---

## Deployment to Vercel

### 1. Connect GitHub Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin https://github.com/your-username/hot-updater-dashboard.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your `hot-updater-dashboard` repository
4. Configure environment variables in Vercel dashboard:
   - Add all variables from `.env.local`
   - Add Clerk/NextAuth keys
   - Add database credentials
   - **IMPORTANT**: Set `HOT_UPDATER_PROJECT_PATH` to `/vercel/path0` (Vercel's working directory)

5. Deploy!

### 3. Vercel Environment Variables

In Vercel dashboard > Settings > Environment Variables, add:

```
# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
AUTHORIZED_EMAILS

# Database (example for Supabase)
DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Or AWS S3
DB_PROVIDER=aws
HOT_UPDATER_S3_BUCKET_NAME
HOT_UPDATER_S3_REGION
HOT_UPDATER_S3_ACCESS_KEY_ID
HOT_UPDATER_S3_SECRET_ACCESS_KEY

# Hot Updater (won't work in serverless - see note below)
HOT_UPDATER_PROJECT_PATH=/vercel/path0
```

### 4. Important Deployment Considerations

#### Hot Updater CLI in Serverless

The `/api/deploy` endpoint executes `npx hot-updater deploy` which **won't work on Vercel** (serverless environment). You have two options:

**Option A: Separate Deployment Server** (Recommended)
- Keep deployments on your local machine or a dedicated server
- Use the dashboard only for viewing deployments and analytics
- Remove the "Deploy" functionality from production

**Option B: Deploy to Railway/Render** (Alternative)
- Use a platform that supports persistent servers
- Railway and Render support long-running Node processes
- Your Hot Updater CLI commands will work properly

### 5. Recommended Production Architecture

```
┌─────────────────────────────────────┐
│  Vercel (Dashboard - Read Only)     │
│  - View deployments                 │
│  - View analytics                   │
│  - Download bundles                 │
│  - Rollback versions               │
└──────────────┬──────────────────────┘
               │
               │ Reads from
               ▼
┌─────────────────────────────────────┐
│  Database (Supabase/AWS S3/etc)     │
│  - Stores bundle metadata           │
└──────────────▲──────────────────────┘
               │
               │ Written by
               │
┌─────────────────────────────────────┐
│  CI/CD or Local Machine             │
│  - Runs: npx hot-updater deploy     │
│  - Creates new bundles              │
└─────────────────────────────────────┘
```

---

## Alternative: Railway Deployment (Supports CLI)

If you need the deploy functionality in production:

### 1. Install Railway CLI

```bash
npm i -g @railway/cli
```

### 2. Deploy to Railway

```bash
railway login
railway init
railway up
```

### 3. Set Environment Variables

```bash
railway variables set DB_PROVIDER=supabase
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://...
# ... add all other variables
```

Railway supports persistent filesystems and long-running processes, so `npx hot-updater deploy` will work.

---

## Access Control Best Practices

### Email Allowlist (with Wildcard Support)

The dashboard supports flexible email authorization patterns:

**Exact Email Matching:**
```env
AUTHORIZED_EMAILS=john@company.com,jane@company.com,cto@company.com
```

**Wildcard Domain (allow entire company):**
```env
# Allow anyone with @yourcompany.com email
AUTHORIZED_EMAILS=*@yourcompany.com
```

**Wildcard Subdomain:**
```env
# Allow anyone from any subdomain: user@dev.company.com, user@staging.company.com
AUTHORIZED_EMAILS=*@*.company.com
```

**Mixed Patterns:**
```env
# Combine exact emails with wildcard domains
AUTHORIZED_EMAILS=john@company.com,*@yourcompany.com,*@partner.com,cto@external.com
```

**Pattern Matching Rules:**
- `john@company.com` - Exact match only
- `*@company.com` - Matches anyone from company.com (e.g., user@company.com)
- `*@*.company.com` - Matches anyone from any subdomain (e.g., user@dev.company.com, user@staging.company.com)

This makes it easy to authorize entire teams or organizations without listing individual emails.

### Role-Based Access (Advanced)

If you need different permission levels:

1. Store roles in your database
2. Add a `user_roles` table
3. Check permissions in API routes:

```typescript
// app/api/deploy/route.ts
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  const { userId } = auth()

  // Check if user has deploy permission
  const userRole = await getUserRole(userId)
  if (userRole !== 'admin' && userRole !== 'deployer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Proceed with deployment
}
```

### Audit Logging

Track who does what:

```typescript
// lib/audit-log.ts
export async function logAction(userId: string, action: string, details: any) {
  await db.insert('audit_logs', {
    user_id: userId,
    action,
    details,
    timestamp: new Date().toISOString()
  })
}

// In API routes
await logAction(userId, 'deploy', { platform: 'ios', channel: 'production' })
```

---

## Security Checklist

- [ ] Enable authentication (Clerk/NextAuth)
- [ ] Set up email allowlist
- [ ] Use environment variables for secrets (never commit)
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set up CORS if needed
- [ ] Add rate limiting for API routes
- [ ] Enable audit logging
- [ ] Use read-only database credentials when possible
- [ ] Regularly review access logs
- [ ] Set up monitoring and alerts

---

## Cost Estimate (Monthly)

**Free Tier Setup:**
- Vercel: Free (hobby tier)
- Clerk: Free (up to 10k MAU)
- Supabase: Free (up to 500MB database)
- Total: **$0/month** for small teams

**Paid Setup (if needed):**
- Vercel Pro: $20/month
- Clerk Pro: $25/month (starts at 10k MAU)
- Supabase Pro: $25/month
- Total: **$70/month** for production use

---

## Quick Start Commands

```bash
# 1. Install Clerk
yarn add @clerk/nextjs

# 2. Set up environment variables
cp .env.local.example .env.local
# Add Clerk keys + authorized emails

# 3. Test locally
yarn dev

# 4. Deploy to Vercel
git add .
git commit -m "Add authentication"
git push

# Then import in Vercel dashboard
```

---

## Need Help?

- **Clerk Documentation**: https://clerk.com/docs/quickstarts/nextjs
- **NextAuth Documentation**: https://next-auth.js.org/getting-started/introduction
- **Vercel Deployment**: https://vercel.com/docs/concepts/deployments/overview
- **Railway Deployment**: https://docs.railway.app/deploy/deployments

---

## What's Next?

After deploying, consider:
1. Set up custom domain (e.g., `updates.yourcompany.com`)
2. Add team member management UI
3. Implement audit logs for compliance
4. Set up monitoring with Vercel Analytics
5. Add webhooks for deployment notifications (Slack/Discord)
