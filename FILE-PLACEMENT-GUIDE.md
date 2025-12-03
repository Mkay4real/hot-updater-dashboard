# 📁 File Placement Guide

## 🎯 Where to Put Each File

This visual guide shows you exactly where each file should go in your Next.js project.

---

## 📂 Complete Project Structure

```
hot-updater-dashboard/                    ← Your project root
│
├── 📄 .env.local                         ← CREATE from env.example
├── 📄 .gitignore                         ← (auto-generated)
├── 📄 next.config.js                     ← (auto-generated)
├── 📄 package.json                       ← REPLACE with provided package.json
├── 📄 tailwind.config.ts                 ← (auto-generated)
├── 📄 tsconfig.json                      ← (auto-generated)
│
├── 📁 app/
│   ├── 📄 layout.tsx                     ← (auto-generated, keep it)
│   ├── 📄 globals.css                    ← (auto-generated, keep it)
│   ├── 📄 page.tsx                       ← REPLACE with hot-updater-dashboard-app.tsx
│   │
│   └── 📁 api/                           ← CREATE this folder
│       │
│       ├── 📁 deployments/               ← CREATE this folder
│       │   └── 📄 route.ts               ← CREATE from api-routes.ts (deployments section)
│       │
│       ├── 📁 bundles/                   ← CREATE this folder
│       │   └── 📄 route.ts               ← CREATE from api-routes.ts (bundles section)
│       │
│       ├── 📁 stats/                     ← CREATE this folder
│       │   └── 📄 route.ts               ← CREATE from api-routes.ts (stats section)
│       │
│       ├── 📁 deploy/                    ← CREATE this folder
│       │   └── 📄 route.ts               ← CREATE from api-routes.ts (deploy section)
│       │
│       └── 📁 rollback/                  ← CREATE this folder
│           └── 📁 [id]/                  ← CREATE this folder (with brackets!)
│               └── 📄 route.ts           ← CREATE from api-routes.ts (rollback section)
│
├── 📁 lib/                               ← CREATE this folder
│   └── 📄 db.ts                          ← COPY lib-db.ts here
│
└── 📁 public/                            ← (auto-generated)
    └── (static files)
```

---

## 🔍 Detailed Instructions

### Step 1: Create the Base Project

```bash
npx create-next-app@latest hot-updater-dashboard \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir

cd hot-updater-dashboard
```

This creates:
- ✅ `app/` folder
- ✅ `app/layout.tsx`
- ✅ `app/globals.css`
- ✅ `app/page.tsx` (you'll replace this)
- ✅ `package.json` (you'll replace this)
- ✅ All config files

---

### Step 2: Replace Main Files

#### 📄 app/page.tsx
```bash
# Delete the existing page.tsx content
rm app/page.tsx

# Copy the dashboard component
cp /path/to/hot-updater-dashboard-app.tsx app/page.tsx
```

**Or manually:** 
1. Open `app/page.tsx`
2. Delete all content
3. Paste content from `hot-updater-dashboard-app.tsx`
4. Save

#### 📄 package.json
```bash
# Replace the package.json
cp /path/to/package.json package.json

# Install dependencies
npm install
```

**Or manually:**
1. Open `package.json`
2. Replace `dependencies` section with the provided one
3. Run `npm install`

---

### Step 3: Create lib Folder

```bash
# Create lib directory
mkdir lib

# Copy database utilities
cp /path/to/lib-db.ts lib/db.ts
```

**Your lib folder should now contain:**
```
lib/
└── db.ts
```

---

### Step 4: Create API Routes

#### Method A: Using Terminal (Recommended)

```bash
# Create all directories
mkdir -p app/api/deployments
mkdir -p app/api/bundles
mkdir -p app/api/stats
mkdir -p app/api/deploy
mkdir -p app/api/rollback/[id]

# Now create route.ts in each folder
# (see next section for content)
```

#### Method B: Using File Explorer

1. Right-click `app` folder → New Folder → `api`
2. Right-click `api` → New Folder → `deployments`
3. Right-click `deployments` → New File → `route.ts`
4. Repeat for other folders

---

### Step 5: Create API Route Files

Open `api-routes.ts` and copy the code sections:

#### 📄 app/api/deployments/route.ts

Copy this section from `api-routes.ts`:

```typescript
// api/deployments/route.ts
import { NextResponse } from 'next/server';
import { getDeployments } from '@/lib/db';

export async function GET() {
  try {
    const deployments = await getDeployments();
    return NextResponse.json(deployments);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json({ error: 'Failed to fetch deployments' }, { status: 500 });
  }
}
```

#### 📄 app/api/bundles/route.ts

```typescript
// api/bundles/route.ts
import { NextResponse } from 'next/server';
import { getBundles } from '@/lib/db';

export async function GET() {
  try {
    const bundles = await getBundles();
    return NextResponse.json(bundles);
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
  }
}
```

#### 📄 app/api/stats/route.ts

```typescript
// api/stats/route.ts
import { NextResponse } from 'next/server';
import { getStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

#### 📄 app/api/deploy/route.ts

```typescript
// api/deploy/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const { platform, channel } = await request.json();

    // Execute hot-updater deploy command
    const command = `npx hot-updater deploy -p ${platform} -c ${channel}`;
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Deployment stderr:', stderr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Deployment completed',
      output: stdout 
    });
  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json({ 
      error: 'Deployment failed', 
      details: error.message 
    }, { status: 500 });
  }
}
```

#### 📄 app/api/rollback/[id]/route.ts

```typescript
// api/rollback/[id]/route.ts
import { NextResponse } from 'next/server';
import { rollbackDeployment } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deploymentId = params.id;
    await rollbackDeployment(deploymentId);

    return NextResponse.json({ 
      success: true, 
      message: 'Rollback completed' 
    });
  } catch (error: any) {
    console.error('Rollback error:', error);
    return NextResponse.json({ 
      error: 'Rollback failed', 
      details: error.message 
    }, { status: 500 });
  }
}
```

---

### Step 6: Create Environment Variables

```bash
# Copy the example file
cp env.example .env.local

# Edit with your values
code .env.local  # or nano, vim, etc.
```

**Update these values:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
HOT_UPDATER_PROJECT_PATH=/path/to/your/react-native-project
```

---

## ✅ Verification Checklist

After placing all files, verify your structure:

```bash
# Check main files
ls app/page.tsx           # Should exist
ls lib/db.ts              # Should exist
ls .env.local             # Should exist

# Check API routes
ls app/api/deployments/route.ts
ls app/api/bundles/route.ts
ls app/api/stats/route.ts
ls app/api/deploy/route.ts
ls app/api/rollback/[id]/route.ts

# All should return the file path if correct
```

---

## 🚀 Quick Copy-Paste Commands

For those who want to do it all at once:

```bash
# Create all directories
mkdir -p app/api/deployments app/api/bundles app/api/stats app/api/deploy app/api/rollback/[id] lib

# Now manually copy the files:
# 1. Copy hot-updater-dashboard-app.tsx → app/page.tsx
# 2. Copy lib-db.ts → lib/db.ts
# 3. Create the 5 route.ts files from api-routes.ts
# 4. Copy env.example → .env.local and update values
# 5. Copy provided package.json over existing one

# Install dependencies
npm install

# Run!
npm run dev
```

---

## 🎯 Visual Quick Reference

```
YOUR FILES              →    WHERE THEY GO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

hot-updater-dashboard-app.tsx  →  app/page.tsx
lib-db.ts                      →  lib/db.ts
env.example                    →  .env.local (with your values)
package.json                   →  package.json (replace)

api-routes.ts                  →  Split into 5 files:
  ├─ deployments section       →  app/api/deployments/route.ts
  ├─ bundles section           →  app/api/bundles/route.ts
  ├─ stats section             →  app/api/stats/route.ts
  ├─ deploy section            →  app/api/deploy/route.ts
  └─ rollback section          →  app/api/rollback/[id]/route.ts
```

---

## 🐛 Common Mistakes to Avoid

1. **❌ Wrong folder name:** `app/api/rollback/id/route.ts`  
   **✅ Correct:** `app/api/rollback/[id]/route.ts` (with brackets!)

2. **❌ Missing lib folder:** Files directly in root  
   **✅ Correct:** `lib/db.ts`

3. **❌ Not replacing page.tsx:** Adding to existing content  
   **✅ Correct:** Delete old content, paste new

4. **❌ Forgetting .env.local:** Using .env or env.local  
   **✅ Correct:** File must be named `.env.local`

5. **❌ Not running npm install:** After updating package.json  
   **✅ Correct:** Always run `npm install` after changes

---

## 📞 Need Help?

If you're stuck:

1. **Double-check this guide** - Follow step by step
2. **Check the terminal** - Look for error messages
3. **Verify file names** - Must be exact (including case)
4. **Check folder structure** - Use `ls` or `tree` command

---

**Last Updated:** November 13, 2025  
**Difficulty:** Easy (15 minutes)  
**Prerequisites:** Node.js 20+, Basic terminal knowledge
