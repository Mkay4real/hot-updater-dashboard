# Contributing to Hot Updater Dashboard

Thank you for your interest in contributing to the Hot Updater Dashboard! This document provides guidelines and instructions for contributors.

## 🌟 Table of Contents

- [Getting Updates](#getting-updates)
- [Contributing Code](#contributing-code)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Submitting Pull Requests](#submitting-pull-requests)

---

## 📥 Getting Updates

If you deployed your own instance using the one-click deploy button, you can easily sync with the latest improvements from the main repository.

### Method 1: GitHub Web Interface (Easiest)

**For users who forked the repository:**

1. Go to your forked repository on GitHub
2. You'll see a message like "This branch is X commits behind original:main"
3. Click **"Sync fork"** button
4. Click **"Update branch"**
5. Your hosting platform (Vercel/Railway) will automatically deploy the updates

**Time:** ~30 seconds

### Method 2: Command Line

**For users who want more control:**

```bash
# One-time setup: Add the original repository as upstream
git remote add upstream https://github.com/your-username/hot-updater-dashboard.git

# Verify remotes
git remote -v
# Should show:
# origin    https://github.com/YOUR-USERNAME/hot-updater-dashboard.git (your fork)
# upstream  https://github.com/your-username/hot-updater-dashboard.git (original)

# Fetch latest changes from upstream
git fetch upstream

# Merge upstream changes into your main branch
git checkout main
git merge upstream/main

# If you have conflicts, resolve them, then:
git add .
git commit -m "Merge upstream updates"

# Push to your repository (triggers auto-deployment)
git push origin main
```

**Time:** ~2 minutes

### Method 3: Automated Sync (GitHub Actions)

**For users who want automatic updates:**

Create a file `.github/workflows/sync-upstream.yml` in your repository:

```yaml
name: Sync Upstream

on:
  schedule:
    # Run every Sunday at midnight UTC
    - cron: '0 0 * * 0'
  workflow_dispatch: # Allows manual triggering

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Sync with upstream
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          # Add upstream if not exists
          git remote add upstream https://github.com/your-username/hot-updater-dashboard.git || true

          # Fetch and merge
          git fetch upstream
          git merge upstream/main --no-edit || echo "Merge conflicts - manual intervention needed"

          # Push if successful
          git push origin main
```

**How it works:**
- Automatically checks for updates every Sunday
- Can also be triggered manually from GitHub Actions tab
- Pushes updates to your repo, triggering auto-deployment

**Setup:**
1. Create the file above in your repository
2. Commit and push: `git add . && git commit -m "Add auto-sync workflow" && git push`
3. Updates will happen automatically every week

### Handling Merge Conflicts

If you customized the code and get merge conflicts:

```bash
# After git merge upstream/main shows conflicts:

# 1. Check which files have conflicts
git status

# 2. Open conflicted files and resolve conflicts
# Look for markers: <<<<<<< HEAD, =======, >>>>>>> upstream/main

# 3. After resolving, mark as resolved
git add <conflicted-file>

# 4. Complete the merge
git commit -m "Merge upstream with custom changes"

# 5. Push to trigger deployment
git push origin main
```

**Pro Tip:** If you heavily customized the code, consider keeping your changes in separate files or using environment variables instead of modifying core files.

---

## 🤝 Contributing Code

We welcome contributions! Here's how to contribute improvements back to the main project.

### Types of Contributions

- **Bug fixes** - Found a bug? Submit a fix!
- **New features** - Have an idea? Propose it first via an issue
- **Documentation** - Improve docs, add examples
- **Performance** - Optimization improvements
- **Tests** - Add test coverage
- **Database providers** - Add support for new providers

### Before You Start

1. **Check existing issues** - Someone might already be working on it
2. **Create an issue** - For features, discuss the approach first
3. **Fork the repository** - Make changes in your fork
4. **Follow code standards** - See below

---

## 💻 Development Setup

### Initial Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/hot-updater-dashboard.git
cd hot-updater-dashboard

# 3. Add upstream remote
git remote add upstream https://github.com/your-username/hot-updater-dashboard.git

# 4. Install dependencies (this project uses yarn)
yarn install

# 5. Set up environment variables
cp env.example .env.local
# Edit .env.local with your test credentials

# 6. Run development server
yarn dev
```

### Development Workflow

```bash
# 1. Create a feature branch
git checkout -b feature/amazing-feature

# 2. Make your changes
# ... edit files ...

# 3. Test your changes
yarn dev
# Verify everything works

# 4. Commit your changes
git add .
git commit -m "feat: add amazing feature"

# 5. Push to your fork
git push origin feature/amazing-feature

# 6. Create Pull Request on GitHub
```

### Testing Locally

```bash
# Run development server
yarn dev

# Build production bundle
yarn build

# Test production build locally
yarn start

# Run linter
yarn lint
```

---

## 📋 Code Standards

### File Organization

```
- Keep API routes in app/api/
- Database functions in lib/db.ts
- Reusable utilities in lib/
- Components in app/ (we use App Router, no separate components/ folder yet)
```

### TypeScript

- **Always use TypeScript** - No plain JavaScript files
- **Define interfaces** - For API responses, database models
- **Avoid `any`** - Use proper types or `unknown`
- **Export types** - Make types reusable

Example:
```typescript
// Good
interface Deployment {
  id: string;
  version: string;
  platform: 'ios' | 'android' | 'all';
}

export async function getDeployments(): Promise<Deployment[]> {
  // ...
}

// Bad
export async function getDeployments(): Promise<any> {
  // ...
}
```

### Database Functions

When adding new database queries:

```typescript
// 1. Add to lib/db.ts
export async function getNewFeature() {
  // Check DB_PROVIDER and implement for each provider
  if (DB_PROVIDER === 'supabase') {
    // Supabase implementation
  }

  if (DB_PROVIDER === 'aws-rds') {
    // PostgreSQL implementation
  }

  // Always provide mock data fallback
  return mockData;
}
```

### API Routes

Follow this pattern:

```typescript
// app/api/new-endpoint/route.ts
import { NextResponse } from 'next/server';
import { getNewFeature } from '@/lib/db';

export async function GET() {
  try {
    const data = await getNewFeature();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Code Style

- **Use Tailwind CSS** - No custom CSS files
- **Functional components** - Prefer hooks over class components
- **Async/await** - Use instead of .then()
- **Error handling** - Always use try/catch for async operations
- **Console logs** - Remove debug logs before committing

### Commit Messages

Follow conventional commits:

```bash
feat: add new feature
fix: resolve bug in deployment
docs: update README
style: format code
refactor: reorganize database functions
perf: improve query performance
test: add unit tests
chore: update dependencies
```

---

## 🚀 Submitting Pull Requests

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Changes work with all supported database providers
- [ ] No TypeScript errors (`yarn build` succeeds)
- [ ] Documentation updated if needed
- [ ] Commits follow conventional commit format
- [ ] Branch is up-to-date with main

### PR Checklist

1. **Title**: Use conventional commit format
   - Example: `feat: add dark mode toggle`

2. **Description**: Explain what and why
   ```markdown
   ## What
   Adds a dark mode toggle to the dashboard header

   ## Why
   Many users requested a dark theme option

   ## How
   - Added theme context provider
   - Created toggle component
   - Updated all color classes to support dark mode

   ## Testing
   - Tested on Chrome, Firefox, Safari
   - Works with all database providers
   ```

3. **Screenshots**: For UI changes, include before/after images

4. **Breaking Changes**: Clearly document any breaking changes

### PR Review Process

1. **Automated checks** - GitHub Actions will run tests
2. **Code review** - Maintainer will review your code
3. **Feedback** - Address any requested changes
4. **Merge** - Once approved, we'll merge your PR!

### After Your PR is Merged

Your contribution will be included in the next release. Thank you! 🎉

---

## 🐛 Reporting Bugs

Found a bug? Please create an issue with:

- **Title**: Brief description
- **Description**: Detailed explanation
- **Steps to reproduce**: How to trigger the bug
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**:
  - OS (macOS, Windows, Linux)
  - Browser (Chrome, Firefox, Safari)
  - Database provider (Supabase, AWS, etc.)
  - Node.js version

Example:
```markdown
## Bug: Deployment modal doesn't close after deploy

**Environment:**
- OS: macOS 14.1
- Browser: Chrome 120
- Database: Supabase
- Node: 20.10.0

**Steps to reproduce:**
1. Click "New Deployment" button
2. Select iOS + Production
3. Click "Deploy"
4. Deployment succeeds but modal stays open

**Expected:** Modal should close after successful deployment
**Actual:** Modal remains open, must click X to close
```

---

## 💡 Feature Requests

Have an idea? We'd love to hear it!

1. **Search existing issues** - Might already be planned
2. **Create a feature request** - Use the feature request template
3. **Describe the use case** - Why would this be useful?
4. **Propose a solution** - How would you implement it?

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You

Every contribution makes this project better. Whether it's code, documentation, bug reports, or feature ideas - thank you for being part of the Hot Updater Dashboard community!

**Questions?** Feel free to open an issue or discussion on GitHub.
