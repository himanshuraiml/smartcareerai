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

> [!TIP]
> Start with Docker locally, then migrate to cloud when ready for production. This guide will be here when you need it!
