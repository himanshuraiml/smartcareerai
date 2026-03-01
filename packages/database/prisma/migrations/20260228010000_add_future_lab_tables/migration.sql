-- Migration: Future-Ready Lab tables
-- lab_tracks, labs, user_lab_progress, weekly_challenges, challenge_submissions

CREATE TABLE IF NOT EXISTS "lab_tracks" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "slug"         TEXT NOT NULL UNIQUE,
  "title"        TEXT NOT NULL,
  "description"  TEXT NOT NULL,
  "icon"         TEXT NOT NULL,
  "gradient"     TEXT NOT NULL,
  "card_bg"      TEXT NOT NULL,
  "border"       TEXT NOT NULL,
  "tag"          TEXT NOT NULL,
  "tag_color"    TEXT NOT NULL,
  "total_minutes" INTEGER NOT NULL DEFAULT 0,
  "is_active"    BOOLEAN NOT NULL DEFAULT true,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "labs" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "track_id"     TEXT NOT NULL REFERENCES "lab_tracks"("id") ON DELETE CASCADE,
  "title"        TEXT NOT NULL,
  "content"      TEXT,
  "duration"     TEXT NOT NULL,
  "duration_min" INTEGER NOT NULL DEFAULT 0,
  "is_free"      BOOLEAN NOT NULL DEFAULT false,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "is_active"    BOOLEAN NOT NULL DEFAULT true,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "labs_track_id_idx" ON "labs"("track_id");
CREATE UNIQUE INDEX IF NOT EXISTS "labs_track_id_order_key" ON "labs"("track_id", "order");

DO $$ BEGIN
  CREATE TYPE "LabStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'REVIEWING', 'EVALUATED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "user_lab_progress" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "user_id"      TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "track_id"     TEXT NOT NULL REFERENCES "lab_tracks"("id") ON DELETE CASCADE,
  "lab_id"       TEXT NOT NULL REFERENCES "labs"("id") ON DELETE CASCADE,
  "status"       TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "completed_at" TIMESTAMP(3),
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_lab_progress_user_id_lab_id_key" ON "user_lab_progress"("user_id", "lab_id");
CREATE INDEX IF NOT EXISTS "user_lab_progress_user_track_idx" ON "user_lab_progress"("user_id", "track_id");

CREATE TABLE IF NOT EXISTS "weekly_challenges" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "title"        TEXT NOT NULL,
  "description"  TEXT NOT NULL,
  "difficulty"   TEXT NOT NULL DEFAULT 'Intermediate',
  "reward"       TEXT NOT NULL,
  "xp_reward"    INTEGER NOT NULL DEFAULT 150,
  "deadline"     TIMESTAMP(3) NOT NULL,
  "week_number"  INTEGER NOT NULL,
  "year"         INTEGER NOT NULL,
  "is_active"    BOOLEAN NOT NULL DEFAULT true,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "weekly_challenges_week_year_key" ON "weekly_challenges"("week_number", "year");

CREATE TABLE IF NOT EXISTS "challenge_submissions" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "challenge_id"  TEXT NOT NULL REFERENCES "weekly_challenges"("id") ON DELETE CASCADE,
  "user_id"       TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "github_url"    TEXT,
  "writeup"       TEXT,
  "score"         INTEGER,
  "ai_feedback"   TEXT,
  "status"        TEXT NOT NULL DEFAULT 'PENDING',
  "submitted_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "evaluated_at"  TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "challenge_submissions_challenge_user_key" ON "challenge_submissions"("challenge_id", "user_id");
CREATE INDEX IF NOT EXISTS "challenge_submissions_user_idx" ON "challenge_submissions"("user_id");
