FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY src ./src

# Compile TypeScript with inline config (standalone build without root tsconfig)
RUN npx tsc --outDir dist --rootDir src --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck --resolveJsonModule --declaration false --sourceMap false

# --- Production ---
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

EXPOSE 3008
CMD ["node", "dist/index.js"]
