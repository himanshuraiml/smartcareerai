# 🌐 Cloud Migration Guide

This guide explains how to migrate SmartCareerAI from local Docker services to free cloud-hosted alternatives for production or if you can't run Docker locally.

---

## Current Local Setup (Docker)

```env
# Local PostgreSQL
DATABASE_URL=postgresql://smartcareer:smartcareer123@localhost:5432/smartcareer_db

# Local Redis
REDIS_URL=redis://localhost:6379

# Local MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

---

## Cloud Migration Options

### 1. PostgreSQL → Neon (Free Tier)

**Neon** offers 0.5 GB storage free forever with auto-suspend for inactive databases.

#### Setup Steps:
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project (e.g., "smartcareer-prod")
3. Copy your connection string from the dashboard

#### Update `.env`:
```env
# Replace local PostgreSQL with Neon
DATABASE_URL=postgresql://username:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/smartcareer_db?sslmode=require
```

#### Prisma Config:
No changes needed - Prisma works with Neon out of the box.

#### Run migration:
```bash
cd packages/database
npx prisma migrate deploy
npx prisma db seed
```

---

### 2. Redis → Upstash (Free Tier)

**Upstash** offers 10,000 commands/day free with 256 MB storage.

#### Setup Steps:
1. Go to [upstash.com](https://upstash.com) and sign up
2. Create a new Redis database
3. Choose your region (pick closest to your users)
4. Copy the connection URL

#### Update `.env`:
```env
# Replace local Redis with Upstash
REDIS_URL=rediss://default:YOUR_PASSWORD@helpful-eel-12345.upstash.io:6379
```

> [!NOTE]
> Upstash uses `rediss://` (with double 's') for TLS connections.

#### Code Changes:
The `ioredis` client we use automatically handles Upstash connections. No code changes needed.

---

### 3. MinIO → Cloudflare R2 (Free Tier)

**Cloudflare R2** offers 10 GB storage + 1M requests/month free (no egress fees!).

#### Setup Steps:
1. Go to [cloudflare.com](https://dash.cloudflare.com) and sign up
2. Navigate to R2 in the sidebar
3. Create a new bucket (e.g., "smartcareer-resumes")
4. Create an API token with R2 permissions

#### Update `.env`:
```env
# Replace MinIO with Cloudflare R2
MINIO_ENDPOINT=your-account-id.r2.cloudflarestorage.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-r2-access-key
MINIO_SECRET_KEY=your-r2-secret-key
MINIO_BUCKET=smartcareer-resumes
```

#### Code Changes in `resume.service.ts`:
```typescript
// Update MinIO client config
this.minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});
```

---

### 4. Alternative: AWS S3 (Free Tier - 12 months)

**AWS S3** offers 5 GB storage free for 12 months.

#### Setup Steps:
1. Create AWS account at [aws.amazon.com](https://aws.amazon.com)
2. Create S3 bucket with appropriate CORS settings
3. Create IAM user with S3 permissions
4. Get access key and secret

#### Update `.env`:
```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=smartcareer-resumes
```

#### Code Changes:
Replace MinIO client with AWS SDK:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

---

## Complete Cloud `.env` Example

```env
# ============================================
# CLOUD PRODUCTION CONFIGURATION
# ============================================

# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/smartcareer_db?sslmode=require

# Cache (Upstash Redis)
REDIS_URL=rediss://default:xxx@helpful-eel-12345.upstash.io:6379

# Storage (Cloudflare R2)
MINIO_ENDPOINT=your-account-id.r2.cloudflarestorage.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-r2-access-key
MINIO_SECRET_KEY=your-r2-secret-key
MINIO_BUCKET=smartcareer-resumes

# JWT (generate a strong secret)
JWT_SECRET=your-super-long-random-string-at-least-32-chars

# OpenAI
OPENAI_API_KEY=sk-...

# Service URLs (for deployment)
AUTH_SERVICE_URL=https://api.smartcareer.com/auth
RESUME_SERVICE_URL=https://api.smartcareer.com/resume
SCORING_SERVICE_URL=https://api.smartcareer.com/scoring
```

---

## Free Tier Comparison

| Service | Provider | Free Tier | Best For |
|---------|----------|-----------|----------|
| **PostgreSQL** | Neon | 0.5 GB, auto-suspend | Development, small apps |
| **PostgreSQL** | Supabase | 500 MB, 2 projects | Apps needing auth too |
| **PostgreSQL** | Railway | $5 credit/month | Quick prototypes |
| **Redis** | Upstash | 10K cmds/day | Caching, rate limiting |
| **Redis** | Redis Cloud | 30 MB | Small cache needs |
| **Storage** | Cloudflare R2 | 10 GB, no egress | File storage (best value) |
| **Storage** | AWS S3 | 5 GB (12 months) | Full AWS ecosystem |

---

## Migration Checklist

- [ ] Sign up for cloud services
- [ ] Create databases/buckets
- [ ] Update `.env` with cloud credentials
- [ ] Run `npx prisma migrate deploy` for database
- [ ] Test all services locally with cloud connections
- [ ] Update CORS settings for production domain
- [ ] Deploy services to hosting platform

---

## Recommended Hosting for Services

| Component | Free Options |
|-----------|--------------|
| **Frontend** | Vercel, Netlify, Cloudflare Pages |
| **Backend** | Railway, Render, Fly.io |
| **Full Stack** | Vercel (frontend) + Railway (backend) |

---

## 🚂 Railway Deployment Guide (All-in-One)

Railway is the **recommended platform** for deploying SmartCareerAI because it supports everything in one place: PostgreSQL, Redis, and all your microservices.

### Prerequisites

- GitHub account (Railway deploys from GitHub)
- Railway account ([railway.app](https://railway.app))
- Your SmartCareerAI repo pushed to GitHub

---

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your SmartCareerAI repository
4. Railway will auto-detect your monorepo structure

---

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway creates the database instantly
3. Click on the PostgreSQL service → **"Variables"** tab
4. Copy `DATABASE_URL` - you'll need this for all services

---

### Step 3: Add Redis Cache

1. Click **"+ New"** → **"Database"** → **"Redis"**
2. Click on Redis service → **"Variables"** tab
3. Copy `REDIS_URL`

---

### Step 4: Deploy Backend Services

For each microservice, create a new service:

#### API Gateway
```bash
# Click "+ New" → "GitHub Repo" → Select your repo
# Configure:
Root Directory: services/api-gateway
Build Command: npm install && npm run build
Start Command: npm start
```

#### Auth Service
```bash
Root Directory: services/auth-service
Build Command: npm install && npm run build
Start Command: npm start
```

#### Resume Service
```bash
Root Directory: services/resume-service
Build Command: npm install && npm run build
Start Command: npm start
```

#### Job Service
```bash
Root Directory: services/job-service
Build Command: npm install && npm run build
Start Command: npm start
```

#### Scoring Service
```bash
Root Directory: services/scoring-service
Build Command: npm install && npm run build
Start Command: npm start
```

#### Interview Service
```bash
Root Directory: services/interview-service
Build Command: npm install && npm run build
Start Command: npm start
```

---

### Step 5: Configure Environment Variables

For **each backend service**, add these variables in Railway's Variables tab:

```env
# Database (from Step 2)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (from Step 3)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secret (same across all services)
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-your-openai-key

# Service URLs (Railway provides these automatically)
PORT=3000
NODE_ENV=production
```

> [!TIP]
> Use Railway's **Variable References** like `${{Postgres.DATABASE_URL}}` to automatically link services!

---

### Step 6: Deploy Frontend (Next.js)

**Option A: Deploy on Railway**
```bash
# Click "+ New" → "GitHub Repo"
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm start
```

Add these variables:
```env
NEXT_PUBLIC_API_URL=https://your-api-gateway.up.railway.app/api/v1
```

**Option B: Deploy on Vercel (Recommended for Frontend)**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set Root Directory to `frontend`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-api-gateway.up.railway.app/api/v1
   ```

---

### Step 7: Run Database Migrations

After all services are deployed, run migrations:

```bash
# Option 1: Use Railway CLI
npm install -g @railway/cli
railway login
railway link  # Select your project
railway run npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# Option 2: Add to API Gateway build command
Build Command: npm install && npx prisma migrate deploy && npm run build
```

---

### Step 8: Configure Custom Domain (Optional)

1. Click on your service → **"Settings"** → **"Domains"**
2. Add a custom domain (e.g., `api.smartcareer.com`)
3. Update your DNS with the provided CNAME record

---

### Railway Project Structure

After setup, your Railway project should look like:

```
SmartCareerAI (Project)
├── 🐘 PostgreSQL (Database)
├── 🔴 Redis (Cache)
├── 🌐 api-gateway (Service)
├── 🔐 auth-service (Service)
├── 📄 resume-service (Service)
├── 💼 job-service (Service)
├── 📊 scoring-service (Service)
├── 🎤 interview-service (Service)
└── 💻 frontend (Service) [or on Vercel]
```

---

### Railway Free Tier Limits

| Resource | Free Tier |
|----------|-----------|
| **Credit** | $5/month |
| **RAM** | 512 MB per service |
| **CPU** | Shared |
| **Bandwidth** | 100 GB |
| **Execution** | 500 hours/month |

> [!IMPORTANT]
> $5/month is usually enough for development/small production. For higher traffic, consider upgrading or optimizing services.

---

### Cost Optimization Tips

1. **Combine services**: Merge smaller services if running low on credit
2. **Use sleep mode**: Railway pauses inactive services
3. **Optimize builds**: Use `npm ci` instead of `npm install` for faster builds
4. **Share database**: All services use the same PostgreSQL instance

---

### Troubleshooting

**Build Fails?**
- Check the build logs in Railway dashboard
- Ensure `package.json` has correct build scripts
- Verify all dependencies are in `dependencies`, not `devDependencies`

**Database Connection Errors?**
- Ensure `DATABASE_URL` is set correctly
- Check if using `${{Postgres.DATABASE_URL}}` reference

**Service Can't Find Other Services?**
- Use Railway's internal networking: `http://service-name.railway.internal:PORT`
- Or use public URLs for external access

---

### Quick Deploy Commands (Railway CLI)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy current directory
railway up

# View logs
railway logs

# Open dashboard
railway open
```

---

> [!TIP]
> Start with Docker locally, then migrate to cloud when ready for production. This guide will be here when you need it!
