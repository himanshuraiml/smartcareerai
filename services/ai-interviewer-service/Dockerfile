# ── ai-interviewer-service — Production Dockerfile ─────────────────────────────
# Build context: REPO ROOT
# Railway settings:
#   Root Directory  : (empty)
#   Dockerfile Path : services/ai-interviewer-service/Dockerfile
# ───────────────────────────────────────────────────────────────────────────────

FROM node:20-slim AS builder

# ffmpeg required by fluent-ffmpeg for TTS/RTP pipeline
RUN apt-get update && apt-get install -y openssl ffmpeg python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY services/ai-interviewer-service ./services/ai-interviewer-service

# Stub all other services so npm workspaces resolves without copying their source
RUN for dir in api-gateway auth-service resume-service scoring-service skill-service \
      job-service application-service interview-service validation-service \
      billing-service admin-service recruiter-service email-tracking-service \
      media-service meeting-bot-service assessment-service report-service; do \
      mkdir -p "services/$dir" && \
      echo "{\"name\":\"@placenxt/$dir\",\"version\":\"1.0.0\",\"private\":true}" \
        > "services/$dir/package.json"; \
    done

RUN mkdir -p frontend && \
    echo '{"name":"frontend","version":"1.0.0","private":true}' > frontend/package.json

RUN npm install --legacy-peer-deps

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

RUN cd services/ai-interviewer-service && npm run build

# ── Production Stage ────────────────────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/services/ai-interviewer-service/dist ./services/ai-interviewer-service/dist
COPY --from=builder /app/services/ai-interviewer-service/package.json ./services/ai-interviewer-service/package.json
# Copy service-specific node_modules (groq-sdk@0.9, uuid@11, @types/express@5 nested due to version conflicts)
COPY --from=builder /app/services/ai-interviewer-service/node_modules ./services/ai-interviewer-service/node_modules

WORKDIR /app/services/ai-interviewer-service

EXPOSE 3016

CMD ["node", "dist/index.js"]
