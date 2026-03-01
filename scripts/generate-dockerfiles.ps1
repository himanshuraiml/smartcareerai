#!/usr/bin/env pwsh
# generate-dockerfiles.ps1
# Generates a self-contained Dockerfile for every backend service.
# Run from repo root: pwsh scripts/generate-dockerfiles.ps1

$services = @(
    "api-gateway",
    "auth-service",
    "resume-service",
    "scoring-service",
    "skill-service",
    "job-service",
    "application-service",
    "interview-service",
    "validation-service",
    "billing-service",
    "admin-service",
    "recruiter-service",
    "email-tracking-service"
)

$template = @'
# ── {SERVICE_NAME} — Production Dockerfile ──────────────────────────────────
# Build context: REPO ROOT
# Railway settings:
#   Root Directory  : (empty)
#   Dockerfile Path : services/{SERVICE_NAME}/Dockerfile
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY services/{SERVICE_NAME} ./services/{SERVICE_NAME}

# Stub all other services so npm workspaces resolves without copying their source
RUN for dir in api-gateway auth-service resume-service scoring-service skill-service \
      job-service application-service interview-service validation-service \
      billing-service admin-service recruiter-service email-tracking-service \
      media-service meeting-bot-service; do \
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

RUN cd services/{SERVICE_NAME} && npm run build

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
COPY --from=builder /app/services/{SERVICE_NAME}/dist ./services/{SERVICE_NAME}/dist
COPY --from=builder /app/services/{SERVICE_NAME}/package.json ./services/{SERVICE_NAME}/package.json

WORKDIR /app/services/{SERVICE_NAME}

CMD ["node", "dist/index.js"]
'@

foreach ($service in $services) {
    $dockerfile = $template -replace '\{SERVICE_NAME\}', $service
    $outPath = "services\$service\Dockerfile"
    Set-Content -Path $outPath -Value $dockerfile -Encoding UTF8
    Write-Host "✅ Generated: $outPath"
}

Write-Host ""
Write-Host "🎉 All Dockerfiles generated!"
Write-Host ""
Write-Host "Next: In Railway dashboard for EACH service, set:"
Write-Host "  Dockerfile Path: services/<service-name>/Dockerfile"
Write-Host "  Root Directory : (empty)"
