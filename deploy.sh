#!/bin/bash

# Deploy Script
echo "🚀 Starting Deployment..."

# 1. Pull latest changes
git pull origin main

# 2. Check for .env file
if [ ! -f .env ]; then
    echo "❌ .env file missing! Please create it."
    exit 1
fi

# 3. Build and Run containers
# Use -f docker-compose.prod.yml
echo "🏗️  Building and Starting Containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Prune unused images to save space
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment Successful! API Gateway is running on port 80."
