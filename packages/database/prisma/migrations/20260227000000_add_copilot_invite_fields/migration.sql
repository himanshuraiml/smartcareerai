-- Migration: add_copilot_invite_fields
-- Adds invite type (AI vs COPILOT), scheduling fields, and copilot session tables.

-- 1. New enum: InterviewInviteType
CREATE TYPE "InterviewInviteType" AS ENUM ('AI', 'COPILOT');

-- 2. New columns on interview_sessions
ALTER TABLE "interview_sessions"
  ADD COLUMN "invite_type"       "InterviewInviteType",
  ADD COLUMN "scheduled_at"      TIMESTAMP(3),
  ADD COLUMN "scheduled_end_at"  TIMESTAMP(3),
  ADD COLUMN "meet_link"         TEXT,
  ADD COLUMN "calendar_event_id" TEXT;

-- 3. CopilotSession: stores live-interview transcript + AI summary
CREATE TABLE "copilot_sessions" (
  "id"         TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "transcript" TEXT NOT NULL,
  "summary"    TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "copilot_sessions_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "copilot_sessions_session_id_key" UNIQUE ("session_id"),
  CONSTRAINT "copilot_sessions_session_id_fkey"
    FOREIGN KEY ("session_id")
    REFERENCES "interview_sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. CopilotSuggestion: individual AI question suggestions during a live call
CREATE TABLE "copilot_suggestions" (
  "id"        TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "text"      TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "copilot_suggestions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "copilot_suggestions_session_id_fkey"
    FOREIGN KEY ("session_id")
    REFERENCES "interview_sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Index for fast suggestion lookups per session
CREATE INDEX "copilot_suggestions_session_id_idx"
  ON "copilot_suggestions"("session_id");
