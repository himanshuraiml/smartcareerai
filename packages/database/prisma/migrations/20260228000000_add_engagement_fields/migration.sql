-- Migration: Add Engagement/Gamification fields to users table
-- These fields support the Login Streak and Daily Rewards feature

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "streak_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0;
