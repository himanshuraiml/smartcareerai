# â”€â”€ email-tracking-service â€” Production Dockerfile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Build context: REPO ROOT
# Railway settings:
#   Root Directory  : (empty)
#   Dockerfile Path : services/email-tracking-service/Dockerfile
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY services/email-tracking-service ./services/email-tracking-service

# Stub all other services so npm workspaces resolves without copying their source
RUN for dir in api-gateway auth-service resume-service scoring-service skill-service \
      job-service application-service interview-service validation-service \
      billing-service admin-service recruiter-service email-tracking-service \
      media-service meeting-bot-service assessment-service report-service ai-interviewer-service; do \
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

RUN cd services/email-tracking-service && npm run build

# â”€â”€ Production Stage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/services/email-tracking-service/dist ./services/email-tracking-service/dist
COPY --from=builder /app/services/email-tracking-service/package.json ./services/email-tracking-service/package.json
# Copy service-specific node_modules for packages not hoisted to root (e.g. node-cron@3 vs root @4)
COPY --from=builder /app/services/email-tracking-service/node_modules ./services/email-tracking-service/node_modules

WORKDIR /app/services/email-tracking-service

CMD ["node", "dist/index.js"]
