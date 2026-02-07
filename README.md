# 🚀 PlaceNxt

**AI-Powered Career Platform for Early-Career Students**

A production-grade SaaS platform that uses AI to help students and early-career professionals optimize their resumes, identify skill gaps, find job opportunities, and practice for interviews.

## 🎯 Features

### Phase 1 (MVP) - Implemented
- ✅ **User Authentication** - JWT-based auth with registration, login, and token refresh
- ✅ **Resume Upload** - PDF/DOC upload with parsing and storage
- ✅ **ATS Scoring** - AI-powered resume analysis with keyword matching

### Phase 2 (Coming Soon)
- 🔜 Skill gap analysis
- 🔜 Job aggregation from multiple sources
- 🔜 Application tracking

### Phase 3 (Planned)
- 📋 AI technical interviews
- 📋 AI HR interview practice
- 📋 Email tracking automation

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, Tailwind CSS, Zustand |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Cache** | Redis |
| **Storage** | MinIO (S3-compatible) |
| **AI** | OpenAI GPT-4 |
| **DevOps** | Docker, Docker Compose |

## 📁 Project Structure

```
PlaceNxt/
├── frontend/                 # Next.js 14 frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── store/           # Zustand stores
│   └── package.json
│
├── services/
│   ├── api-gateway/         # API Gateway (port 3000)
│   ├── auth-service/        # Authentication (port 3001)
│   ├── resume-service/      # Resume management (port 3002)
│   └── scoring-service/     # ATS scoring (port 3003)
│
├── packages/
│   ├── database/            # Prisma schema & migrations
│   └── shared/              # Shared types & validation
│
├── docker-compose.yml       # Local development stack
├── package.json             # Root workspace config
└── .env.example             # Environment template
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenAI API Key

### Setup

1. **Clone and install dependencies**
   ```bash
   cd PlaceNxt
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

3. **Start infrastructure**
   ```bash
   docker-compose up -d postgres redis minio
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Start backend services
   npm run dev:services
   
   # Terminal 2: Start frontend
   npm run dev:frontend
   ```

6. **Open in browser**
   - Frontend: http://localhost:3100
   - API Gateway: http://localhost:3000

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/refresh-token` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/resumes/upload` | Upload resume |
| GET | `/api/v1/resumes` | List user resumes |
| GET | `/api/v1/resumes/:id` | Get resume details |
| DELETE | `/api/v1/resumes/:id` | Delete resume |

### Scoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/scores/analyze` | Analyze resume for ATS |
| GET | `/api/v1/scores/history` | Get score history |
| GET | `/api/v1/scores/:id` | Get score details |

## 🔒 Security

- JWT-based authentication with short-lived access tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting on API endpoints
- Input validation with Zod schemas
- CORS configuration
- Helmet.js security headers

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with ❤️ for early-career professionals
