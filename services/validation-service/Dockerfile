FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 3008

CMD ["node", "dist/index.js"]
