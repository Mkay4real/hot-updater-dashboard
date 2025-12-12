# Hot Updater Official Server API

## Summary

**Yes**, Hot Updater provides an official `@hot-updater/server` package with APIs for fetching bundle information programmatically. However, it currently has bundling conflicts with Next.js due to ESM/CommonJS module resolution issues with the `fumadb` dependency.

## Official APIs Available

Hot Updater's `@hot-updater/server` package (v0.25.4) provides these APIs:

### Core Bundle Management

```typescript
import { createHotUpdater } from '@hot-updater/server';
import { s3Database, s3Storage } from '@hot-updater/aws';

const api = createHotUpdater({
  database: s3Database({
    bucketName: process.env.HOT_UPDATER_S3_BUCKET_NAME,
    region: process.env.HOT_UPDATER_S3_REGION,
    credentials: {
      accessKeyId: process.env.HOT_UPDATER_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.HOT_UPDATER_S3_SECRET_ACCESS_KEY,
    },
  }),
  storages: [s3Storage({ /* same config */ })],
  basePath: '/hot-updater',
});

// Fetch bundles with pagination and filtering
const result = await api.getBundles({
  where: { channel: 'production', platform: 'ios' },
  limit: 50,
  offset: 0,
});

// Get single bundle
const bundle = await api.getBundleById('019b75e3-76b7-7683-9c1e-6084afc83a5b');

// Get available channels
const channels = await api.getChannels();

// Bundle CRUD operations
await api.insertBundle(bundle);
await api.updateBundleById(bundleId, updates);
await api.deleteBundleById(bundleId);
```

### HTTP Handler for Web Frameworks

```typescript
import { createHandler } from '@hot-updater/server';

// Exposes RESTful endpoints:
// GET  /api/bundles - List bundles
// GET  /api/bundles/:id - Get bundle by ID
// GET  /api/bundles/channels - List channels
// POST /api/bundles - Create bundle(s)
// DELETE /api/bundles/:id - Delete bundle
// GET  /fingerprint/:platform/:hash/:channel/:minId/:id - Update check
// GET  /app-version/:platform/:version/:channel/:minId/:id - Update check

const handler = api.handler; // Web Standard Request/Response
```

## Why We're Not Using It (Yet)

### Current Issue: Next.js Bundling Conflict

```
Module not found: Package path . is not exported from package
/Users/.../node_modules/fumadb (see exports field in package.json)
```

**Root Cause:**
- `@hot-updater/server` depends on `fumadb` (ORM abstraction layer)
- `fumadb` has improper ESM/CommonJS exports in its `package.json`
- Next.js webpack bundler cannot resolve the package correctly
- Affects both API routes and server components

### Current Solution: Direct S3 Access

We're currently using direct S3 access to read bundle metadata:

**Advantages:**
✅ **Works reliably** with Next.js
✅ **Type-safe** with TypeScript
✅ **Complete control** over data transformation
✅ **No external dependencies** beyond AWS SDK
✅ **Well-tested** and production-ready

**How it works:**
1. Reads `update.json` files from S3 (`{channel}/{platform}/{version}/update.json`)
2. Parses arrays of bundle objects from JSON files
3. Extracts timestamps from UUIDv7 bundle IDs
4. Fetches actual bundle sizes using S3 `HeadObjectCommand`
5. Transforms data to match dashboard's display format

**Code location:** [lib/db.ts](lib/db.ts) lines 100-300

## Migration Path (Future)

When the bundling issues are resolved, migration will be straightforward:

### Step 1: Update Dependencies

```bash
yarn add @hot-updater/server@latest @hot-updater/aws@latest
```

### Step 2: Replace Manual S3 Parsing

In [lib/db.ts](lib/db.ts), replace:

```typescript
// Current implementation
const bundlesData = await readS3BundlesMetadata();
```

With:

```typescript
// Future official API
const result = await hotUpdaterAPI.getBundles({ limit: 50, offset: 0 });
const bundles = result.data;
```

### Step 3: Update All Query Functions

- `getDeployments()` → Use `api.getBundles()`
- `getBundles()` → Use `api.getBundles()`
- `getStats()` → Use `api.getBundles()` for stats calculation
- `rollbackDeployment()` → Use `api.updateBundleById()`

**Estimated effort:** 2-3 hours

## Benefits of Future Migration

Once the bundling issues are resolved:

1. **Future-proof** - Automatic compatibility with Hot Updater updates
2. **Type-safe** - Full TypeScript definitions included
3. **Provider-agnostic** - Easy switching between AWS/Supabase/Cloudflare
4. **Less code** - Remove ~200 lines of manual S3 parsing
5. **Built-in pagination** - Proper limit/offset support
6. **Additional features** - Channel management, update checks, etc.

## Tracking Resolution

Monitor these for updates:

- **Hot Updater GitHub**: https://github.com/gronxb/hot-updater/issues
- **fumadb GitHub**: https://github.com/rayepps/fumadb/issues
- **Next.js Module Resolution**: Watch for Next.js 15+ ESM improvements

## Current Status Summary

| Feature | Manual Implementation | Official API |
|---------|----------------------|--------------|
| **Status** | ✅ Production-ready | ⚠️ Bundling conflicts |
| **Bundle Listing** | ✅ Working | ❌ Not usable |
| **Pagination** | ✅ Client-side | ✅ Server-side |
| **Filtering** | ✅ Manual | ✅ Built-in |
| **Type Safety** | ✅ Custom types | ✅ Official types |
| **Maintenance** | ⚠️ Manual updates needed | ✅ Auto-compatible |
| **Bundle Sizes** | ✅ Fetched from S3 | ✅ Available via storage URI |

## Recommendation

**Continue using the current manual S3 implementation** until:

1. Hot Updater or fumadb releases a fix for the bundling issue, OR
2. Next.js 15+ provides better ESM/CommonJS interop, OR
3. You migrate to a non-Next.js backend (Express, Fastify, Hono, etc.)

The current implementation is **production-ready, maintainable, and working reliably**. The official API can be adopted when the ecosystem stabilizes.

---

**Last Updated:** 2026-01-01
**Dashboard Version:** 1.0.0
**Hot Updater Server Version:** 0.25.4
