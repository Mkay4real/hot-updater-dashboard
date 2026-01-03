# Vercel Deployment Quick Start

Deploy your Hot Updater Dashboard to production in **5 minutes** with free hosting and authentication.

## Prerequisites

- GitHub account
- Clerk account (sign up at [clerk.com](https://clerk.com) - free)
- Your Hot Updater database already set up (Supabase/AWS S3/PostgreSQL)

---

## Step 1: Get Clerk API Keys (2 minutes)

1. Go to [clerk.com](https://clerk.com) and sign up/login
2. Click **"Add application"**
3. Name it: **"Hot Updater Dashboard"**
4. Choose authentication methods (Email + Google recommended)
5. Click **"Create application"**
6. Copy your API keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_`)
   - `CLERK_SECRET_KEY` (starts with `sk_`)

**Keep these keys handy** - you'll need them in Step 4.

---

## Step 2: Push to GitHub (1 minute)

If you haven't already:

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit with Clerk authentication"

# Create GitHub repo and push
git remote add origin https://github.com/Mkay4real/hot-updater-dashboard.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel (1 minute)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `hot-updater-dashboard` repository
4. **DO NOT click Deploy yet!** We need to add environment variables first

---

## Step 4: Add Environment Variables (2 minutes)

In the Vercel project setup page, click **"Environment Variables"** and add:

### Required - Authentication (Clerk)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Required - Database (Choose ONE based on your setup)

**If using Supabase:**
```
DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**If using AWS S3:**
```
DB_PROVIDER=aws
HOT_UPDATER_S3_BUCKET_NAME=your-bucket-name
HOT_UPDATER_S3_REGION=us-east-1
HOT_UPDATER_S3_ACCESS_KEY_ID=AKIA...
HOT_UPDATER_S3_SECRET_ACCESS_KEY=...
```

**If using PostgreSQL:**
```
DB_PROVIDER=postgres
DATABASE_URL=postgresql://user:pass@host:5432/database
```

### Optional - Email Allowlist (Supports Wildcards)
```
# Exact emails
AUTHORIZED_EMAILS=john@company.com,jane@company.com,cto@company.com

# Or wildcard domain (allow everyone from your company)
AUTHORIZED_EMAILS=*@yourcompany.com

# Or mix both
AUTHORIZED_EMAILS=john@company.com,*@yourcompany.com,*@partner.com
```

---

## Step 5: Deploy! (30 seconds)

1. Click **"Deploy"**
2. Wait for build to complete (~2 minutes)
3. Click **"Visit"** to see your live dashboard
4. You'll be redirected to sign in

---

## Step 6: Configure Clerk Settings (1 minute)

Back in your Clerk dashboard:

1. Go to **"Paths"** → Set:
   - Sign-in URL: `https://your-app.vercel.app/sign-in`
   - Sign-up URL: `https://your-app.vercel.app/sign-up`
   - Home URL: `https://your-app.vercel.app`

2. Go to **"Sign-up"** settings:
   - **Disable public sign-ups** (enable invite-only mode)
   - Or **Restrict to specific domains** (e.g., yourcompany.com)

3. **Invite team members**:
   - Go to **"Users"** → **"Invite"**
   - Enter stakeholder emails
   - They'll receive invitation links

---

## Step 7: Add Custom Domain (Optional)

1. In Vercel, go to **Settings** → **Domains**
2. Add your domain: `updates.yourcompany.com`
3. Update DNS records as shown
4. Update Clerk URLs to use custom domain

---

## What You Get (Free Tier)

✅ **Vercel Hosting**: Free for personal/team use
✅ **Clerk Authentication**: Free up to 10,000 monthly active users
✅ **Automatic HTTPS**: SSL certificates managed by Vercel
✅ **Automatic Deployments**: Every git push = new deployment
✅ **Email Verification**: Built into Clerk
✅ **User Management**: Invite/remove users via Clerk dashboard

**Total Cost: $0/month** for small teams

---

## Testing Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. You should see the sign-in page
3. Sign in with your email
4. You should see the dashboard with:
   - ✅ Your deployments from the database
   - ✅ Bundle information
   - ✅ Analytics stats
   - ✅ User profile button (top right)
   - ❌ No "New Deployment" button (only available in local development)

---

## Important Notes

### Deploy Button is Disabled in Production

The **"New Deployment"** button only appears when running locally (`NODE_ENV=development`). This is by design because:

- Vercel runs on **serverless functions** (no persistent shell access)
- The `npx hot-updater deploy` command requires a full Node.js runtime
- **Solution**: Deploy via CI/CD or your local machine

**Your dashboard is READ-ONLY in production:**
- ✅ View all deployments
- ✅ View analytics
- ✅ Download bundles
- ✅ Rollback versions (if implemented)
- ❌ Trigger new deployments (use CI/CD instead)

### Setting Up CI/CD for Deployments (Optional)

See [DEPLOYMENT.md](DEPLOYMENT.md#optional-step-4-cicd-setup-later) for instructions on:
- GitHub Actions workflow
- Trigger deploys with `git tag v1.0.0`
- Automatic deployments on merge to main

---

## Troubleshooting

### Issue: "Unauthorized access" error
**Solution**: Add your email to `AUTHORIZED_EMAILS` in Vercel environment variables

### Issue: "Sign-in redirects to localhost"
**Solution**: Update Clerk dashboard URLs to use your Vercel domain

### Issue: Can't see any data
**Solution**: Check database environment variables match your Hot Updater setup

### Issue: Build fails
**Solution**: Make sure all required environment variables are set in Vercel

### Issue: "Clerk is not defined" error
**Solution**: Rebuild and redeploy. Vercel may have cached old build without Clerk.

---

## Next Steps

1. **Invite your team**: Add stakeholders via Clerk dashboard
2. **Set up CI/CD**: Automate deployments with GitHub Actions
3. **Custom domain**: Add `updates.yourcompany.com`
4. **Monitoring**: Enable Vercel Analytics (Settings → Analytics)
5. **Webhooks**: Add Slack/Discord notifications (optional)

---

## Support

- **Clerk Issues**: https://clerk.com/support
- **Vercel Issues**: https://vercel.com/support
- **Dashboard Issues**: Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide

---

## Security Checklist

- [x] Authentication enabled (Clerk)
- [x] HTTPS enabled (automatic on Vercel)
- [x] Email allowlist configured (optional but recommended)
- [x] Public sign-ups disabled in Clerk
- [x] Database credentials stored as environment variables
- [x] `.env.local` not committed to git
- [ ] Audit logging enabled (see DEPLOYMENT.md)
- [ ] Regular access reviews scheduled

---

**You're done!** Your Hot Updater Dashboard is now live and accessible to authorized stakeholders. 🎉

For advanced configuration, see the full [DEPLOYMENT.md](DEPLOYMENT.md) guide.
