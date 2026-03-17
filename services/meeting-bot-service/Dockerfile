# ── meeting-bot-service — Production Dockerfile ────────────────────────────────
# Build context: REPO ROOT
# Railway settings:
#   Root Directory  : (empty)
#   Dockerfile Path : services/meeting-bot-service/Dockerfile
# ───────────────────────────────────────────────────────────────────────────────

FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY services/meeting-bot-service ./services/meeting-bot-service

# Stub all other services so npm workspaces resolves without copying their source
RUN for dir in api-gateway auth-service resume-service scoring-service skill-service \
      job-service application-service interview-service validation-service \
      billing-service admin-service recruiter-service email-tracking-service \
      media-service assessment-service report-service ai-interviewer-service; do \
      mkdir -p "services/$dir" && \
      echo "{\"name\":\"@placenxt/$dir\",\"version\":\"1.0.0\",\"private\":true}" \
        > "services/$dir/package.json"; \
    done

RUN mkdir -p frontend && \
    echo '{"name":"frontend","version":"1.0.0","private":true}' > frontend/package.json

RUN npm install --legacy-peer-deps

RUN cd services/meeting-bot-service && npm run build

# ── Production Stage ────────────────────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/meeting-bot-service/dist ./services/meeting-bot-service/dist
COPY --from=builder /app/services/meeting-bot-service/package.json ./services/meeting-bot-service/package.json

WORKDIR /app/services/meeting-bot-service

EXPOSE 3013

CMD ["node", "dist/index.js"]
