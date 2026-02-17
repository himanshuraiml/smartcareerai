FROM node:20-alpine AS deps

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./

# Copy frontend package files  
COPY frontend/package.json ./frontend/package.json

# Copy necessary workspace packages for dependencies
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/database/package.json ./packages/database/package.json

# Install ALL dependencies (including workspaces)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Set DOCKER_BUILD so next.config.js enables standalone output
ENV DOCKER_BUILD=true

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# COPY --from=deps /app/frontend/node_modules ./frontend/node_modules 2>/dev/null || true

# Copy workspace structure
COPY package.json package-lock.json* ./
COPY frontend ./frontend
COPY packages ./packages

# Build the Next.js application
WORKDIR /app/frontend
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3100

ENV PORT=3100
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
