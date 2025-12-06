# 🚀 Quick Start Guide - Hot Updater Dashboard

Get your dashboard up and running in 15 minutes!

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ Node.js 20+ installed
- ✅ A React Native project with Hot Updater configured
- ✅ A Supabase account (free tier works great!)
- ✅ Basic familiarity with React and Next.js

## 🎯 Step-by-Step Setup

### 1️⃣ Create Your Dashboard Project (2 minutes)

```bash
# Create a new Next.js project
npx create-next-app@latest hot-updater-dashboard \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir

cd hot-updater-dashboard

# Install required dependencies
npm install lucide-react recharts date-fns @supabase/supabase-js
```

### 2️⃣ Set Up Supabase Database (5 minutes)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New project"
   - Choose a name (e.g., "hot-updater-dashboard")
   - Set a strong password
   - Wait for provisioning (~2 minutes)

2. **Create Database Tables**
   - Navigate to SQL Editor in your Supabase dashboard
   - Click "New query"
   - Copy and paste this SQL:

```sql
-- Deployments table
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'all')),
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  deployed_by TEXT,
  bundle_size BIGINT,
  downloads INTEGER DEFAULT 0,
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bundles table
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  channel TEXT NOT NULL,
  size BIGINT NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_deployments_deployed_at ON deployments(deployed_at DESC);
CREATE INDEX idx_bundles_active ON bundles(active);
```

   - Click "Run" to execute

3. **Get Your Credentials**
   - Go to Project Settings → API
   - Copy "Project URL" and "anon public" key
   - Save these for the next step

### 3️⃣ Configure Environment Variables (2 minutes)

Create a `.env.local` file in your project root:

```bash
# Create the file
touch .env.local

# Open in your editor
code .env.local  # or nano, vim, etc.
```

Add your credentials:

```env
DB_PROVIDER=supabase

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

HOT_UPDATER_PROJECT_PATH=/path/to/your/react-native-project
```

**⚠️ Replace the values with your actual credentials!**

### 4️⃣ Add Dashboard Files (3 minutes)

Download the provided files and place them in your project:

```
hot-updater-dashboard/
├── app/
│   ├── page.tsx                 # ← Copy hot-updater-dashboard-app.tsx here
│   ├── layout.tsx              # Already exists
│   └── api/                    # Create this folder
│       ├── deployments/
│       │   └── route.ts        # ← Create from api-routes.ts
│       ├── bundles/
│       │   └── route.ts        # ← Create from api-routes.ts
│       ├── stats/
│       │   └── route.ts        # ← Create from api-routes.ts
│       ├── deploy/
│       │   └── route.ts        # ← Create from api-routes.ts
│       └── rollback/
│           └── [id]/
│               └── route.ts    # ← Create from api-routes.ts
└── lib/
    └── db.ts                    # ← Copy lib-db.ts here
```

#### Creating the Files:

**app/page.tsx:**
```typescript
// Copy the entire content from hot-updater-dashboard-app.tsx
// into app/page.tsx
```

**lib/db.ts:**
```bash
# Create the lib directory
mkdir lib

# Copy the database utilities
# Copy content from lib-db.ts into lib/db.ts
```

**API Routes:**
```bash
# Create API directories
mkdir -p app/api/deployments
mkdir -p app/api/bundles
mkdir -p app/api/stats
mkdir -p app/api/deploy
mkdir -p app/api/rollback/[id]

# Then create route.ts files in each directory
# Copy the respective functions from api-routes.ts
```

### 5️⃣ Run Your Dashboard! (1 minute)

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser! 🎉

## 🎨 You Should See:

- 📊 Four stat cards at the top
- 🚀 A "New Deployment" button
- 📑 Three tabs: Deployments, Bundles, Analytics
- 🎯 Beautiful gradient design with smooth animations

## 🧪 Test With Mock Data

Initially, the dashboard will show mock data. This is perfect for testing!

To connect to your real Hot Updater data:

1. Deploy something with Hot Updater:
```bash
cd /path/to/your/react-native-project
npx hot-updater deploy -p ios -c staging
```

2. The deployment info should appear in your dashboard!

## 🔄 Add a Deployment Hook (Optional)

To automatically track deployments in your dashboard, add this to your `hot-updater.config.ts`:

```typescript
import { defineConfig } from 'hot-updater';

export default defineConfig({
  // ... your existing config

  // Add this hook
  hooks: {
    afterDeploy: async (deployment) => {
      // Send deployment data to your dashboard
      await fetch('http://localhost:3000/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: deployment.version,
          platform: deployment.platform,
          channel: deployment.channel,
          status: 'success',
          bundle_size: deployment.bundleSize,
        })
      });
    }
  }
});
```

## 🐛 Troubleshooting

### "Supabase client error"
- ✅ Check that your `.env.local` values are correct
- ✅ Make sure there are no spaces or quotes around the values
- ✅ Restart your dev server: `Ctrl+C` then `npm run dev`

### "Table doesn't exist"
- ✅ Verify you ran the SQL in Supabase SQL Editor
- ✅ Check the Supabase Table Editor to see if tables exist

### "Mock data still showing"
- ✅ This is normal if you haven't deployed anything yet
- ✅ Try deploying with Hot Updater to see real data

### "Deploy button doesn't work"
- ✅ Make sure HOT_UPDATER_PROJECT_PATH is correct in `.env.local`
- ✅ Verify Hot Updater is properly configured in your RN project

## 🎓 Next Steps

Now that your dashboard is running:

1. **🔐 Add Authentication**
   - Install NextAuth.js
   - Protect your dashboard routes
   - [NextAuth.js Guide](https://next-auth.js.org/)

2. **🚀 Deploy to Production**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel
   ```

3. **📱 Mobile Access**
   - Your dashboard is fully responsive
   - Access it from your phone to deploy on the go!

4. **📊 Add Analytics**
   - Integrate Google Analytics
   - Track user engagement
   - Monitor update adoption

5. **🔔 Set Up Notifications**
   - Add Slack webhooks
   - Get notified of new deployments
   - Alert on failed deployments

## 💡 Pro Tips

- **Use Multiple Channels**: Create separate channels for dev, staging, and production
- **Schedule Deployments**: Use cron jobs to deploy at specific times
- **Monitor Adoption**: Check the Analytics tab to see update adoption rates
- **Quick Rollback**: Keep previous versions active for instant rollbacks
- **Team Access**: Share the dashboard URL with your team

## 📚 Resources

- [Hot Updater Docs](https://hot-updater.dev)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🎉 Congratulations!

You now have a professional dashboard for managing your React Native OTA updates!

---

**Questions?** Open an issue or join the community!

**Found this helpful?** Give it a ⭐ on GitHub!
