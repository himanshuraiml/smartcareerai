FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

# Compile TypeScript with inline config (standalone build without root tsconfig)
RUN npx tsc --outDir dist --rootDir src --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck --resolveJsonModule --declaration false --sourceMap false

# --- Production ---
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
