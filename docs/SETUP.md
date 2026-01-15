# Spitalfields Reviews - Setup Guide

This document covers the configuration steps for Convex, WorkOS AuthKit, R2 storage, and ImageKit.

## Architecture Overview

- **Database**: Convex (real-time reactive queries)
- **Authentication**: WorkOS AuthKit via Convex component
- **File Storage**: Cloudflare R2
- **Image CDN**: ImageKit (connected to R2)
- **Frontend**: React + Vite

---

## 1. Convex Setup

### Initial Setup

```bash
# Install Convex
bun add convex

# Initialize Convex project (creates convex/ directory)
bunx convex init

# Start development server
bunx convex dev
```

### Environment Variables (Convex Dashboard)

Go to your [Convex Dashboard](https://dashboard.convex.dev) → Settings → Environment Variables and add:

| Variable | Description |
|----------|-------------|
| `WORKOS_API_KEY` | WorkOS API key (starts with `sk_`) |
| `WORKOS_CLIENT_ID` | WorkOS Client ID (starts with `client_`) |
| `WORKOS_WEBHOOK_SECRET` | WorkOS webhook signing secret |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret key |
| `R2_BUCKET_NAME` | R2 bucket name (default: `reviews-photos`) |

### Frontend Environment Variables

Create `.env.local` in the project root:

```bash
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_WORKOS_CLIENT_ID=client_...
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/callback
```

---

## 2. WorkOS AuthKit Setup

### WorkOS Dashboard Configuration

1. Go to [WorkOS Dashboard](https://dashboard.workos.com)
2. Create or select your project
3. Configure OAuth:
   - **Redirect URIs**: Add your callback URLs
     - Development: `http://localhost:5173/callback`
     - Production: `https://your-domain.com/callback`
   - **Allowed origins**: Add your frontend origins
     - Development: `http://localhost:5173`
     - Production: `https://your-domain.com`

### Convex Auth Configuration

The auth configuration is in `convex/auth.ts`:

```typescript
import { WorkOSAuthKit } from "@convex-dev/workos-authkit";

export const workosAuthKit = new WorkOSAuthKit();

export const { auth, signIn, signOut, getAuthUserId } = workosAuthKit.functions();
export const { httpAction } = workosAuthKit;
```

### Auth Config File

Create `convex/auth.config.ts`:

```typescript
export default {
  providers: [
    {
      domain: "https://api.workos.com",
      applicationID: "client_..." // Your WorkOS Client ID
    }
  ]
};
```

**Important**: The `applicationID` must match your WorkOS Client ID to validate JWT tokens.

---

## 3. Cloudflare R2 Setup

### Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Create a bucket named `reviews-photos`
3. Note your Account ID (visible in the URL or sidebar)

### Create R2 API Token

1. Go to R2 → Manage R2 API Tokens
2. Create a new token with:
   - **Permissions**: Object Read & Write
   - **Bucket**: Select your bucket or allow all
3. Save the Access Key ID and Secret Access Key

### R2 Bucket Structure

Photos are stored with the following key pattern:
```
photos/{venue_id}/{photo_id}.{ext}
photos/{venue_id}/reviews/{photo_id}.{ext}  # For review photos
```

---

## 4. ImageKit Setup

### Configure ImageKit Origin

1. Go to [ImageKit Dashboard](https://imagekit.io/dashboard)
2. Add a new origin:
   - **Origin Type**: Web Folder / S3 Compatible
   - **Origin URL**: Your R2 bucket public URL or S3-compatible endpoint
   - **S3 Access Key**: Your R2 Access Key ID
   - **S3 Secret Key**: Your R2 Secret Access Key
   - **S3 Bucket**: `reviews-photos`
   - **S3 Endpoint**: `https://{account_id}.r2.cloudflarestorage.com`

### ImageKit URL Pattern

The app constructs ImageKit URLs as:
```
https://ik.imagekit.io/{imagekit_id}/{storage_key}?tr={transforms}
```

Update the ImageKit ID in `src/client/lib/imagekit.ts` if needed:
```typescript
const IMAGEKIT_URL = "https://ik.imagekit.io/your-imagekit-id";
```

---

## 5. Data Migration (from D1)

If migrating from the old Cloudflare D1 database:

### Export D1 Data

```bash
# Run the export script
bun run scripts/export-d1.ts
```

This creates JSON files in `scripts/d1-export/`.

### Import to Convex

```bash
# Run the migration script
bun run scripts/migrate-to-convex.ts
```

The migration:
1. Imports users (maps old IDs to new Convex IDs)
2. Imports venues (preserves relationships)
3. Imports reviews
4. Imports photos (preserves R2 storage keys)
5. Imports favorites
6. Sets default main photos for venues

---

## 6. Production Deployment

### Convex Production Environment

1. In Convex Dashboard, switch to Production environment
2. Add all environment variables (same as development):
   - `WORKOS_API_KEY`
   - `WORKOS_CLIENT_ID`
   - `WORKOS_WEBHOOK_SECRET`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

3. Deploy to production:
   ```bash
   bunx convex deploy
   ```

### Frontend Production Build

Update `.env.production`:
```bash
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_WORKOS_CLIENT_ID=client_...
VITE_WORKOS_REDIRECT_URI=https://your-domain.com/callback
```

Build and deploy:
```bash
bun run build
# Deploy dist/ to your hosting provider
```

### WorkOS Production Configuration

1. In WorkOS Dashboard, ensure production redirect URIs are configured:
   - `https://your-domain.com/callback`
2. Ensure allowed origins include your production domain

### Checklist for Production

- [ ] Convex environment variables set in Production
- [ ] WorkOS redirect URIs include production URLs
- [ ] WorkOS allowed origins include production domain
- [ ] Frontend env vars point to production Convex URL
- [ ] ImageKit origin configured for R2 bucket
- [ ] R2 bucket accessible to ImageKit

---

## Troubleshooting

### Auth Issues

**"Missing environment variables: WORKOS_API_KEY"**
- Ensure all WorkOS env vars are set in Convex Dashboard

**"ApplicationID must be specified"**
- Add `applicationID` to `convex/auth.config.ts`

**JWT validation errors**
- Ensure `applicationID` in auth.config.ts matches `VITE_WORKOS_CLIENT_ID`

### Image Loading Issues

**Images return 404**
- Verify ImageKit origin is configured correctly
- Check that R2 bucket name matches
- Verify the storage key path exists in R2

**Images not transformed**
- Ensure ImageKit URL doesn't include extra path segments
- Check `src/client/lib/imagekit.ts` for correct base URL

### R2 Upload Issues

**"R2 credentials not configured"**
- Set R2 environment variables in Convex Dashboard
- Ensure the R2 API token has write permissions

---

## Development Commands

```bash
# Start development (frontend + Convex)
bun run dev

# Start only frontend
bun run dev:frontend

# Start only Convex
bun run dev:backend

# Deploy Convex to production
bunx convex deploy

# Build frontend for production
bun run build
```
