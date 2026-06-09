# ── daily-challenge-service – Production Dockerfile ──────────────────────────
# Build context: REPO ROOT
# Railway settings:
#   Root Directory  : (empty)
#   Dockerfile Path : services/daily-challenge-service/Dockerfile
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY services/daily-challenge-service ./services/daily-challenge-service

# Stub all other services so npm workspaces resolves without copying their source
RUN for dir in api-gateway auth-service resume-service scoring-service skill-service \
      job-service application-service interview-service validation-service \
      billing-service admin-service recruiter-service email-tracking-service \
      media-service meeting-bot-service assessment-service report-service \
      ai-interviewer-service notification-service; do \
      if [ ! -d "services/$dir" ]; then \
        mkdir -p "services/$dir" && \
        echo "{\"name\":\"@placenxt/$dir\",\"version\":\"1.0.0\",\"private\":true}" \
          > "services/$dir/package.json"; \
      fi; \
    done

RUN mkdir -p frontend && \
    echo '{"name":"frontend","version":"1.0.0","private":true}' > frontend/package.json

RUN npm install --legacy-peer-deps

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

RUN cd packages/shared && npm run build

RUN cd services/daily-challenge-service && npm run build

# ── Production Stage ──────────────────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/services/daily-challenge-service/dist ./services/daily-challenge-service/dist
COPY --from=builder /app/services/daily-challenge-service/package.json ./services/daily-challenge-service/package.json

WORKDIR /app/services/daily-challenge-service

CMD ["node", "dist/index.js"]
