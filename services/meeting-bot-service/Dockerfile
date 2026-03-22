# ── meeting-bot-service — Production Dockerfile ────────────────────────────────
# Build context: REPO ROOT
# Railway settings:
#   Root Directory  : (empty)
#   Dockerfile Path : services/meeting-bot-service/Dockerfile
# ───────────────────────────────────────────────────────────────────────────────

FROM node:20-slim AS builder

# Puppeteer/Chromium build deps
RUN apt-get update && apt-get install -y \
    openssl chromium fonts-liberation libatk-bridge2.0-0 libatk1.0-0 \
    libcairo2 libcups2 libdbus-1-3 libgbm1 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnss3 libpango-1.0-0 libx11-6 \
    libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
    libxrender1 libxtst6 xvfb \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

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

# Puppeteer/Chromium runtime deps
RUN apt-get update && apt-get install -y \
    openssl chromium fonts-liberation libatk-bridge2.0-0 libatk1.0-0 \
    libcairo2 libcups2 libdbus-1-3 libgbm1 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnss3 libpango-1.0-0 libx11-6 \
    libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
    libxrender1 libxtst6 xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/meeting-bot-service/dist ./services/meeting-bot-service/dist
COPY --from=builder /app/services/meeting-bot-service/package.json ./services/meeting-bot-service/package.json
# Copy service-specific node_modules (puppeteer@19 is nested due to version conflict with root puppeteer@24)
COPY --from=builder /app/services/meeting-bot-service/node_modules ./services/meeting-bot-service/node_modules

WORKDIR /app/services/meeting-bot-service

EXPOSE 3013

CMD ["node", "dist/index.js"]
