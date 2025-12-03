# 🚀 Hot Updater Dashboard

A beautiful, modern dashboard for managing your Hot Updater deployments. Built with Next.js 14, React, TypeScript, and Tailwind CSS.

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a2e/ffffff?text=Hot+Updater+Dashboard)

## ✨ Features

- 📊 **Real-time Deployment Tracking** - Monitor all your OTA updates
- 🚀 **One-Click Deployments** - Deploy updates directly from the dashboard
- 📱 **Platform-Specific Views** - Separate iOS and Android management
- 🔄 **Easy Rollbacks** - Revert to previous versions instantly
- 📈 **Analytics Dashboard** - Track adoption rates and user metrics
- 🎨 **Beautiful UI** - Modern, gradient-based design with smooth animations
- 🔒 **Secure** - Built-in authentication ready
- ⚡ **Fast** - Optimized with Next.js 14 App Router

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Database**: Supabase (or PostgreSQL, Cloudflare D1)
- **Deployment**: Vercel (recommended)

## 📦 Installation

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest hot-updater-dashboard --typescript --tailwind --app

cd hot-updater-dashboard
```

### Step 2: Install Dependencies

```bash
npm install lucide-react recharts date-fns @supabase/supabase-js
```

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the root:

```env
# Database Provider (supabase, postgres, or cloudflare-d1)
DB_PROVIDER=supabase

# Supabase Configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# PostgreSQL Configuration (if using direct connection)
# DATABASE_URL=postgresql://user:password@host:5432/database

# Hot Updater Configuration
HOT_UPDATER_PROJECT_PATH=/path/to/your/react-native/project
```

### Step 4: Copy Dashboard Files

Copy the provided files into your project:

```
hot-updater-dashboard/
├── app/
│   ├── page.tsx                    # Main dashboard component
│   ├── api/
│   │   ├── deployments/
│   │   │   └── route.ts           # Deployments API
│   │   ├── bundles/
│   │   │   └── route.ts           # Bundles API
│   │   ├── stats/
│   │   │   └── route.ts           # Stats API
│   │   ├── deploy/
│   │   │   └── route.ts           # Deploy API
│   │   └── rollback/
│   │       └── [id]/
│   │           └── route.ts       # Rollback API
└── lib/
    └── db.ts                       # Database utilities
```

### Step 5: Set Up Database (Supabase)

1. Go to your [Supabase project](https://app.supabase.com)
2. Navigate to SQL Editor
3. Run the following SQL:

```sql
-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
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
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  channel TEXT NOT NULL,
  size BIGINT NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App users table (for tracking)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,
  app_version TEXT,
  bundle_version TEXT,
  last_update_check TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update stats table
CREATE TABLE IF NOT EXISTS update_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_checks INTEGER DEFAULT 0,
  successful_updates INTEGER DEFAULT 0,
  failed_updates INTEGER DEFAULT 0,
  adoption_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deployments_channel ON deployments(channel);
CREATE INDEX IF NOT EXISTS idx_deployments_platform ON deployments(platform);
CREATE INDEX IF NOT EXISTS idx_deployments_deployed_at ON deployments(deployed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bundles_active ON bundles(active);
CREATE INDEX IF NOT EXISTS idx_app_users_bundle_version ON app_users(bundle_version);
```

### Step 6: Run the Dashboard

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your dashboard!

## 🎨 Customization

### Change Color Scheme

Edit the gradient colors in `app/page.tsx`:

```typescript
// Current: Purple to Pink gradient
className="bg-gradient-to-r from-purple-500 to-pink-500"

// Change to: Blue to Cyan
className="bg-gradient-to-r from-blue-500 to-cyan-500"
```

### Add Authentication

Add NextAuth.js for authentication:

```bash
npm install next-auth
```

Then wrap your dashboard with authentication:

```typescript
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return <HotUpdaterDashboard />;
}
```

## 📱 Connecting to Hot Updater

The dashboard integrates with your existing Hot Updater setup. Make sure:

1. Your Hot Updater is configured in your React Native project
2. The `.env.local` file points to the correct project path
3. You have the Hot Updater CLI installed: `npm install -g hot-updater`

### Triggering Deployments

The dashboard executes Hot Updater commands via API routes:

```typescript
// Example deployment
POST /api/deploy
{
  "platform": "ios",
  "channel": "production"
}

// This runs: npx hot-updater deploy -p ios -c production
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# - Add all your .env.local variables
# - Connect your GitHub repo for automatic deployments
```

### Deploy to Other Platforms

The dashboard works on any platform that supports Next.js:
- Netlify
- Railway
- Render
- DigitalOcean App Platform

## 📊 Dashboard Features

### Deployments View
- See all past deployments
- Filter by platform (iOS/Android)
- Filter by channel (dev/staging/production)
- View deployment status
- Track download counts

### Bundles View
- Browse all available bundles
- See bundle sizes
- Download bundles manually
- View active/inactive bundles

### Analytics View
- Deployment trends over time
- Platform distribution
- Update adoption rates
- User engagement metrics

### Quick Deploy
- One-click deployments
- Select platform and channel
- Real-time progress updates
- Error handling

### Rollback
- Revert to any previous version
- One-click rollback
- Confirmation prompts for safety

## 🔧 Advanced Configuration

### Custom Database Queries

Modify `lib/db.ts` to add custom queries:

```typescript
export async function getDeploymentsByChannel(channel: string) {
  const { data, error } = await supabase
    .from('deployments')
    .select('*')
    .eq('channel', channel)
    .order('deployed_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### Webhooks Integration

Add webhooks to notify your team:

```typescript
// In api/deploy/route.ts
await fetch('https://hooks.slack.com/your-webhook', {
  method: 'POST',
  body: JSON.stringify({
    text: `New deployment: v${version} to ${channel}`
  })
});
```

### Real-time Updates

Use Supabase real-time subscriptions:

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('deployments')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'deployments' },
      (payload) => {
        setDeployments(prev => [payload.new, ...prev]);
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

## 🐛 Troubleshooting

### Dashboard shows mock data

Make sure your database is properly configured and the connection string is correct.

### Deployments fail

Check that:
1. Hot Updater CLI is installed globally
2. Your React Native project path is correct in `.env.local`
3. You have proper AWS/Supabase credentials configured

### Database connection errors

Verify:
1. Database URL is correct
2. Database tables are created
3. Supabase anon key has proper permissions

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - feel free to use this dashboard in your projects!

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [Hot Updater](https://hot-updater.dev/)
- [Lucide Icons](https://lucide.dev/)

## 📧 Support

Need help? 
- Open an issue on GitHub
- Check the [Hot Updater documentation](https://hot-updater.dev)
- Join the community Discord

---

Made with ❤️ for the React Native community
