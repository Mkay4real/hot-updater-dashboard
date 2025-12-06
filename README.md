# 🚀 Hot Updater Dashboard

A production-ready, modern dashboard for managing Hot Updater (OTA) deployments for React Native applications. Built with Next.js 14, React 18, TypeScript, and Tailwind CSS.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

- 📊 **Real-time Deployment Tracking** - Monitor all your OTA updates in one place
- 🚀 **One-Click Deployments** - Deploy updates directly from the dashboard
- 📱 **Multi-Platform Support** - Manage iOS, Android, or cross-platform deployments
- 🔄 **Instant Rollbacks** - Revert to previous versions with a single click
- 📈 **Analytics Dashboard** - Track adoption rates, downloads, and user metrics
- 🎨 **Beautiful UI** - Modern gradient-based design with smooth animations
- 🔒 **Production-Ready** - Security headers, error handling, and optimizations included
- ⚡ **Fast & Responsive** - Optimized performance with Next.js 14 App Router
- 🗄️ **Flexible Database** - Supports Supabase, PostgreSQL, or Cloudflare D1

## 📸 Preview

The dashboard features:
- Clean, gradient-based design with purple/pink color scheme
- Real-time statistics cards showing key metrics
- Tabbed interface for Deployments, Bundles, and Analytics
- Deployment modal for quick updates
- Responsive design that works on all devices

## 🏗️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Custom components with Lucide React icons
- **Charts**: Recharts 2.12
- **Database**: Supabase / PostgreSQL / Cloudflare D1
- **Deployment**: Vercel (recommended), Netlify, or any Node.js host

## 📦 Installation

### Prerequisites

- Node.js 20.x or later
- npm, yarn, or pnpm
- A Supabase account (or PostgreSQL/Cloudflare D1)
- Hot Updater configured in your React Native project

### Quick Setup

```bash
# Clone or download this repository
cd hot-updater-dashboard

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your credentials

# Run the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your dashboard!

### Environment Configuration

Edit `.env.local` with your settings:

```env
# Database provider: supabase, postgres, or cloudflare-d1
DB_PROVIDER=supabase

# Supabase (recommended for quick start)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Path to your React Native project with hot-updater.config.ts
HOT_UPDATER_PROJECT_PATH=/path/to/your/react-native-project
```

### Database Setup (Supabase)

1. Create a [Supabase project](https://app.supabase.com)
2. Go to SQL Editor and run the following:

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

-- App users table (for tracking)
CREATE TABLE app_users (
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
CREATE TABLE update_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_checks INTEGER DEFAULT 0,
  successful_updates INTEGER DEFAULT 0,
  failed_updates INTEGER DEFAULT 0,
  adoption_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_deployments_channel ON deployments(channel);
CREATE INDEX idx_deployments_platform ON deployments(platform);
CREATE INDEX idx_deployments_deployed_at ON deployments(deployed_at DESC);
CREATE INDEX idx_bundles_active ON bundles(active);
CREATE INDEX idx_app_users_bundle_version ON app_users(bundle_version);
```

3. Copy your Project URL and anon key to `.env.local`

## 📁 Project Structure

```
hot-updater-dashboard/
├── app/
│   ├── page.tsx                      # Main dashboard component
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles
│   └── api/
│       ├── deployments/
│       │   └── route.ts             # GET deployments
│       ├── bundles/
│       │   └── route.ts             # GET bundles
│       ├── stats/
│       │   └── route.ts             # GET statistics
│       ├── deploy/
│       │   └── route.ts             # POST deploy
│       └── rollback/
│           └── [id]/
│               └── route.ts         # POST rollback
├── lib/
│   └── db.ts                         # Database utilities
├── docs/
│   ├── FILE-PLACEMENT-GUIDE.md       # Visual guide
│   └── REACT-NATIVE-INTEGRATION-GUIDE.md  # RN integration
├── public/                           # Static assets
├── .env.local                        # Environment variables (create from env.example)
├── .gitignore                        # Git ignore rules
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── postcss.config.js                 # PostCSS configuration
└── package.json                      # Dependencies
```

## 🚀 Usage

### Deploying Updates

1. Click the "New Deployment" button in the dashboard
2. Select platform (iOS, Android, or Both)
3. Choose channel (production, staging, or development)
4. Click "Deploy"

The dashboard will execute:
```bash
npx hot-updater deploy -p <platform> -c <channel>
```

### Rolling Back

1. Go to the Deployments tab
2. Find the version you want to rollback to
3. Click the "Rollback" button
4. Confirm the action

### Viewing Analytics

Navigate to the Analytics tab to see:
- Deployment trends over time
- Platform distribution (iOS vs Android)
- Update adoption rates
- Active user counts

## 🔧 Development

### Available Scripts

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

### Mock Data

The dashboard includes mock data for development and testing. When database connections fail or return no data, mock data is automatically used.

To test with real data:
```bash
cd /path/to/your/react-native-project
npx hot-updater deploy -p all -c staging
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Connect GitHub repo for automatic deployments
```

### Deploy to Other Platforms

The dashboard works on any platform supporting Next.js:
- **Netlify**: Connect your Git repo
- **Railway**: Deploy from GitHub
- **Render**: Add as web service
- **DigitalOcean**: Use App Platform

## 🔐 Security

### Security Features Included

- **Security Headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Input Validation**: All API routes validate inputs
- **Environment Variables**: Sensitive data stored in `.env.local`
- **No Hardcoded Credentials**: All credentials from environment
- **HTTPS Ready**: Works with SSL/TLS out of the box

### Adding Authentication

For production deployments, add authentication:

**Option 1: NextAuth.js**
```bash
npm install next-auth
```

**Option 2: Supabase Auth**
```bash
# Already included with @supabase/supabase-js
# Configure in Supabase dashboard
```

**Option 3: Custom JWT**
- Implement middleware in `middleware.ts`
- Protect API routes and dashboard

## 🎨 Customization

### Changing Colors

Edit gradient colors in [app/page.tsx](app/page.tsx):

```typescript
// Current: Purple to Pink
className="bg-gradient-to-r from-purple-500 to-pink-500"

// Change to: Blue to Cyan
className="bg-gradient-to-r from-blue-500 to-cyan-500"

// Change to: Green to Teal
className="bg-gradient-to-r from-green-500 to-teal-500"
```

### Database Providers

Switch between providers in `.env.local`:

```env
# Supabase (easiest)
DB_PROVIDER=supabase

# PostgreSQL (self-hosted)
DB_PROVIDER=postgres
DATABASE_URL=postgresql://...

# Cloudflare D1 (edge)
DB_PROVIDER=cloudflare-d1
```

## 📊 API Reference

### GET /api/deployments
Returns list of deployments

**Response:**
```json
[
  {
    "id": "uuid",
    "version": "1.2.5",
    "platform": "ios",
    "channel": "production",
    "status": "success",
    "deployedAt": "2 hours ago",
    "deployedBy": "john@example.com",
    "bundleSize": "2.3 MB",
    "downloads": 15420
  }
]
```

### POST /api/deploy
Triggers a new deployment

**Request:**
```json
{
  "platform": "ios",
  "channel": "production"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deployment completed",
  "output": "..."
}
```

### POST /api/rollback/:id
Rollback to specific deployment

**Response:**
```json
{
  "success": true,
  "message": "Rollback completed"
}
```

## 🐛 Troubleshooting

### Dashboard shows mock data
- Check database connection in `.env.local`
- Verify Supabase tables are created
- Try deploying with Hot Updater to populate data

### Deployment fails
- Verify `HOT_UPDATER_PROJECT_PATH` is correct
- Ensure Hot Updater is configured in React Native project
- Check Hot Updater CLI is installed: `npm install -g hot-updater`

### Database connection errors
- Verify Supabase URL and key in `.env.local`
- Check Supabase project is active
- Ensure tables exist in Supabase Table Editor

## 📚 Documentation

- [Quick Start Guide](QUICKSTART.md) - 15-minute setup
- [File Placement Guide](docs/FILE-PLACEMENT-GUIDE.md) - Visual structure guide
- [React Native Integration](docs/REACT-NATIVE-INTEGRATION-GUIDE.md) - RN setup
- [Hot Updater Docs](https://hot-updater.dev) - Official documentation

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this dashboard in your projects!

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Supabase](https://supabase.com/) - Database
- [Hot Updater](https://hot-updater.dev/) - OTA updates
- [Lucide React](https://lucide.dev/) - Icons
- [Recharts](https://recharts.org/) - Charts

## 📧 Support

- 📖 [Documentation](https://hot-updater.dev)
- 🐛 [Report Issues](https://github.com/your-username/hot-updater-dashboard/issues)
- 💬 [Discussions](https://github.com/your-username/hot-updater-dashboard/discussions)

---

**Made with ❤️ for the React Native community**

**Version:** 1.0.0 | **Last Updated:** December 3, 2025
