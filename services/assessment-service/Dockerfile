# ── assessment-service — Production Dockerfile ─────────────────────────────────
# Build context: REPO ROOT
# Railway settings:
#   Root Directory  : (empty)
#   Dockerfile Path : services/assessment-service/Dockerfile
# ───────────────────────────────────────────────────────────────────────────────

FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY services/assessment-service ./services/assessment-service

# Stub all other services so npm workspaces resolves without copying their source
RUN for dir in api-gateway auth-service resume-service scoring-service skill-service \
      job-service application-service interview-service validation-service \
      billing-service admin-service recruiter-service email-tracking-service \
      media-service meeting-bot-service report-service ai-interviewer-service; do \
      mkdir -p "services/$dir" && \
      echo "{\"name\":\"@placenxt/$dir\",\"version\":\"1.0.0\",\"private\":true}" \
        > "services/$dir/package.json"; \
    done

RUN mkdir -p frontend && \
    echo '{"name":"frontend","version":"1.0.0","private":true}' > frontend/package.json

RUN npm install --legacy-peer-deps

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

RUN cd services/assessment-service && npm run build

# ── Production Stage ────────────────────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/services/assessment-service/dist ./services/assessment-service/dist
COPY --from=builder /app/services/assessment-service/package.json ./services/assessment-service/package.json

WORKDIR /app/services/assessment-service

EXPOSE 3015

CMD ["node", "dist/index.js"]
