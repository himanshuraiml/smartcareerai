FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma@5.22.0 generate

COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 3003

CMD ["node", "dist/index.js"]
