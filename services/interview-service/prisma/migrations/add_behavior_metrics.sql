-- Migration: Add behavior_metrics column to interview_sessions
-- Generated for: SmartCareerAI AI Interview Feature
-- Apply on Railway: This will be auto-applied when interview-service redeploys
-- with the updated Prisma schema (prisma db push or migrate deploy).

ALTER TABLE "interview_sessions"
  ADD COLUMN IF NOT EXISTS "behavior_metrics" JSONB;

-- Optional: index for fast lookups on sessions with behavior data
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_behavior_metrics
--   ON "interview_sessions" ((behavior_metrics IS NOT NULL));

COMMENT ON COLUMN "interview_sessions"."behavior_metrics" IS
  'Aggregated client-side AI metrics (MediaPipe vision + Groq audio). '
  'Shape: {eyeContact, dominantEmotion, postureScore, speechRate, fillerWords, avgPause, clarityScore, confidenceScore, sampleCount}';
