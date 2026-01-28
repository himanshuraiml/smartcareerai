# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Medhiva is an AI-powered career platform for early-career students. It's a microservices-based SaaS application using Node.js/Express backend services, Next.js 14 frontend, PostgreSQL with Prisma ORM, and OpenAI GPT-4 for AI features.

## Common Commands

```bash
# Start infrastructure (PostgreSQL, Redis, MinIO)
docker-compose up -d postgres redis minio

# Run database migrations and seed
npm run db:migrate
npm run db:seed

# Start all backend services (runs 11 services concurrently)
npm run dev:services

# Start frontend (separate terminal)
npm run dev:frontend

# Build all workspaces
npm run build

# Lint entire project
npm run lint

# Docker operations
npm run docker:up      # Start all containers
npm run docker:down    # Stop all containers
npm run docker:build   # Build all Docker images
```

### Database Commands (from packages/database)
```bash
npm run migrate         # Run Prisma migrations (dev)
npm run migrate:deploy  # Deploy migrations (prod)
npm run generate        # Regenerate Prisma client
npm run seed            # Run database seeding
npm run studio          # Open Prisma Studio
```

## Architecture

### Microservices (services/)

All services run on Express.js with TypeScript. The API Gateway proxies requests to downstream services:

| Service | Port | Purpose |
|---------|------|---------|
| api-gateway | 3000 | Routes requests, rate limiting, JWT extraction |
| auth-service | 3001 | User authentication, JWT tokens |
| resume-service | 3002 | Resume upload/parsing, MinIO storage |
| scoring-service | 3003 | ATS scoring with OpenAI |
| skill-service | 3004 | Skill management, job roles |
| job-service | 3005 | Job listings aggregation |
| application-service | 3006 | Job application tracking |
| interview-service | 3007 | AI interview practice |
| validation-service | 3008 | Skill tests and badges |
| billing-service | 3010 | Subscriptions (Razorpay) |
| admin-service | 3011 | Admin panel APIs |
| recruiter-service | 3012 | Recruiter features |

### Frontend (frontend/)

Next.js 14 with App Router running on port 3100:
- `src/app/` - Page routes (dashboard, login, register, admin, recruiter, institution-admin, pricing)
- `src/components/` - React components
- `src/store/auth.store.ts` - Zustand auth state management
- `src/lib/` - Utilities and API clients
- `src/hooks/` - Custom React hooks

### Shared Packages (packages/)

- `@smartcareer/database` - Prisma schema, migrations, and client
- `@smartcareer/shared` - Shared Zod validation schemas and types

### Infrastructure

- **PostgreSQL 16** - Main database
- **Redis 7** - Caching and session storage
- **MinIO** - S3-compatible object storage for resume files

## API Routes

All API routes are prefixed with `/api/v1/`. The gateway extracts `userId` from JWT and forwards it via `x-user-id` header to services.

Key route patterns:
- `/api/v1/auth/*` → auth-service
- `/api/v1/resumes/*` → resume-service
- `/api/v1/scores/*` → scoring-service
- `/api/v1/skills/*` → skill-service
- `/api/v1/jobs/*` → job-service
- `/api/v1/interviews/*` → interview-service
- `/api/v1/admin/*` → admin-service
- `/api/v1/billing/*` → billing-service

## Database Schema

The Prisma schema (`packages/database/prisma/schema.prisma`) includes:

**Core models:** User, Resume, AtsScore, RefreshToken
**Skills system:** Skill, UserSkill, Course, SkillTest, TestQuestion, TestAttempt, SkillBadge
**Jobs:** JobRole, JobListing, Application, JobRoleCache
**Interviews:** InterviewSession, InterviewQuestion
**Billing:** SubscriptionPlan, UserSubscription, UserCredit, CreditTransaction
**Recruiters:** Recruiter, SavedCandidate, RecruiterJob, Message
**Institutions:** Institution

User roles: `USER`, `RECRUITER`, `ADMIN`, `INSTITUTION_ADMIN`

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key
- `OPENAI_API_KEY` - For AI features (scoring, interviews)
- `MINIO_*` - Object storage credentials
- `RAZORPAY_*` - Payment processing (billing-service)

## Workspace Structure

This is an npm workspace monorepo. Package references:
- Services use `@smartcareer/database` for Prisma client
- Services use `@smartcareer/shared` for validation schemas
