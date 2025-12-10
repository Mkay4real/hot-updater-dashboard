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
- 🗄️ **Flexible Database** - Supports Supabase, AWS RDS, DynamoDB, PostgreSQL, or Cloudflare D1

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
- **Database**: Supabase / AWS RDS / DynamoDB / PostgreSQL / Cloudflare D1
- **Deployment**: Vercel (recommended), AWS Lambda@Edge, Netlify, or any Node.js host

## 📦 Installation

### Prerequisites

- Node.js 20.x or later
- npm, yarn, or pnpm
- A database provider: Supabase, AWS RDS, DynamoDB, PostgreSQL, or Cloudflare D1
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

Edit `.env.local` with your settings based on your chosen database provider:

**Supabase:**
```env
DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
HOT_UPDATER_PROJECT_PATH=/path/to/your/react-native-project
```

**AWS RDS:**
```env
DB_PROVIDER=aws-rds
AWS_RDS_HOST=your-rds-instance.region.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=hotupdater
AWS_RDS_USER=postgres
AWS_RDS_PASSWORD=your-password
AWS_RDS_SSL=true
HOT_UPDATER_PROJECT_PATH=/path/to/your/react-native-project
```

**DynamoDB (for Lambda@Edge):**
```env
DB_PROVIDER=dynamodb
AWS_DYNAMODB_REGION=us-east-1
AWS_DYNAMODB_TABLE_NAME=hot-updater-bundles
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
HOT_UPDATER_PROJECT_PATH=/path/to/your/react-native-project
```

For AWS providers, install additional dependencies:
```bash
npm install pg @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### Database Setup

**Important:** This dashboard uses Hot Updater's existing database schema. The tables are automatically created when you run `npx hot-updater init` in your React Native project.

**Setup Steps:**

1. **In your React Native project:**
   ```bash
   cd /path/to/your/react-native-project
   npx hot-updater init
   ```
   Select your preferred database provider during initialization.

2. **The `bundles` table will be automatically created with this schema:**
   - `id`: UUID (UUIDv7 with embedded timestamp)
   - `platform`: 'ios' or 'android'
   - `channel`: Deployment channel ('development', 'staging', 'production')
   - `enabled`: Boolean flag indicating if bundle is active
   - `file_hash`: SHA256 hash of the bundle file
   - `git_commit_hash`: Git commit when bundle was created
   - `message`: Deployment message/notes
   - `metadata`: JSONB field containing app_version and other data
   - `storage_uri`: Location of bundle file in storage
   - `fingerprint_hash`: Unique fingerprint for bundle identification
   - `target_app_version`: Specific app version this bundle targets (nullable)
   - `should_force_update`: Whether to force update on clients

3. **Copy the same credentials to this dashboard's `.env.local`**

For more details, see [lib/db.ts](lib/db.ts).

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
│   └── db.ts                         # Database utilities (multi-provider support)
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
# Supabase (easiest, recommended for quick start)
DB_PROVIDER=supabase

# AWS RDS (production PostgreSQL)
DB_PROVIDER=aws-rds

# DynamoDB (serverless/Lambda@Edge)
DB_PROVIDER=dynamodb

# PostgreSQL (self-hosted)
DB_PROVIDER=postgres
DATABASE_URL=postgresql://...

# Cloudflare D1 (edge database)
DB_PROVIDER=cloudflare-d1
```

**Provider Comparison:**

| Provider | Best For | Setup Difficulty | Cost |
|----------|----------|------------------|------|
| Supabase | Quick start, prototypes | Easy | Free tier available |
| AWS RDS | Production workloads | Medium | Pay per hour |
| DynamoDB | Serverless/Edge deployments | Medium | Pay per request |
| PostgreSQL | Self-hosted control | Medium | Infrastructure cost |
| Cloudflare D1 | Global edge performance | Medium | Free tier available |

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

- [CLAUDE.md](CLAUDE.md) - Detailed project architecture and development guide
- [Hot Updater Docs](https://hot-updater.dev) - Official Hot Updater documentation
- [Database Layer](lib/db.ts) - Multi-provider database implementation

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
