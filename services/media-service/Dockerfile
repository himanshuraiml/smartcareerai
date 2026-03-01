# ─── Media Service — Production Dockerfile ───────────────────────────────────
# This is a self-contained Dockerfile for the media-service.
# Build context must be the REPO ROOT (not this directory).
#
# Railway settings:
#   Root Directory  : (empty — repo root)
#   Dockerfile Path : services/media-service/Dockerfile
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-slim AS builder

# MediaSoup requires Python + build tools for native compilation
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json tsconfig.json ./

# Copy workspace packages
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared

# Copy media-service source
COPY services/media-service ./services/media-service

# Create stub package.json files for all other services so npm workspaces resolves
RUN for dir in api-gateway auth-service resume-service scoring-service skill-service \
    job-service application-service interview-service validation-service \
    billing-service admin-service recruiter-service email-tracking-service \
    meeting-bot-service; do \
    mkdir -p "services/$dir" && \
    echo "{\"name\":\"@placenxt/$dir\",\"version\":\"1.0.0\",\"private\":true}" \
    > "services/$dir/package.json"; \
    done

# Create stub for frontend workspace
RUN mkdir -p frontend && \
    echo '{"name":"frontend","version":"1.0.0","private":true}' > frontend/package.json

# Install all dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build shared package first
RUN cd packages/shared && npm run build

# Build media-service
RUN cd services/media-service && npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl python3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules (includes Prisma client)
COPY --from=builder /app/node_modules ./node_modules

# Copy shared package
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy database package (Prisma schema + client)
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Copy built media-service
COPY --from=builder /app/services/media-service/dist ./services/media-service/dist
COPY --from=builder /app/services/media-service/package.json ./services/media-service/package.json

WORKDIR /app/services/media-service

EXPOSE 3014

CMD ["node", "dist/index.js"]
