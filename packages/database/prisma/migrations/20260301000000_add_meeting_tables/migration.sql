-- Migration: Add WebRTC Meeting System Tables
-- This migration is purely ADDITIVE — no existing tables or data are modified.
-- Safe to apply to a live database.

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE "MeetingStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'ENDED', 'CANCELLED');

CREATE TYPE "MeetingRole" AS ENUM ('HOST', 'RECRUITER', 'CANDIDATE', 'OBSERVER');

-- ============================================
-- MEETING ROOMS
-- ============================================

CREATE TABLE "meeting_rooms" (
    "id"               TEXT NOT NULL,
    "interview_id"     TEXT,
    "host_id"          TEXT NOT NULL,
    "status"           "MeetingStatus" NOT NULL DEFAULT 'WAITING',
    "meeting_token"    TEXT NOT NULL,
    "max_participants" INTEGER NOT NULL DEFAULT 10,
    "scheduled_at"     TIMESTAMP(3),
    "started_at"       TIMESTAMP(3),
    "ended_at"         TIMESTAMP(3),
    "recording_url"    TEXT,
    "transcript_url"   TEXT,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_rooms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_rooms_interview_id_key"   ON "meeting_rooms"("interview_id");
CREATE UNIQUE INDEX "meeting_rooms_meeting_token_key"  ON "meeting_rooms"("meeting_token");
CREATE INDEX        "meeting_rooms_host_id_idx"        ON "meeting_rooms"("host_id");

ALTER TABLE "meeting_rooms"
    ADD CONSTRAINT "meeting_rooms_host_id_fkey"
    FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "meeting_rooms"
    ADD CONSTRAINT "meeting_rooms_interview_id_fkey"
    FOREIGN KEY ("interview_id") REFERENCES "interview_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- MEETING PARTICIPANTS
-- ============================================

CREATE TABLE "meeting_participants" (
    "id"           TEXT NOT NULL,
    "meeting_id"   TEXT NOT NULL,
    "user_id"      TEXT NOT NULL,
    "role"         "MeetingRole" NOT NULL DEFAULT 'CANDIDATE',
    "joined_at"    TIMESTAMP(3),
    "left_at"      TIMESTAMP(3),
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_at"   TIMESTAMP(3),
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_participants_meeting_id_user_id_key"
    ON "meeting_participants"("meeting_id", "user_id");
CREATE INDEX "meeting_participants_user_id_idx"
    ON "meeting_participants"("user_id");

ALTER TABLE "meeting_participants"
    ADD CONSTRAINT "meeting_participants_meeting_id_fkey"
    FOREIGN KEY ("meeting_id") REFERENCES "meeting_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_participants"
    ADD CONSTRAINT "meeting_participants_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- MEETING CHAT MESSAGES
-- ============================================

CREATE TABLE "meeting_chat_messages" (
    "id"         TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "content"    TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "meeting_chat_messages_meeting_id_created_at_idx"
    ON "meeting_chat_messages"("meeting_id", "created_at");

ALTER TABLE "meeting_chat_messages"
    ADD CONSTRAINT "meeting_chat_messages_meeting_id_fkey"
    FOREIGN KEY ("meeting_id") REFERENCES "meeting_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- MEETING TRANSCRIPT ENTRIES
-- ============================================

CREATE TABLE "meeting_transcript_entries" (
    "id"           TEXT NOT NULL,
    "meeting_id"   TEXT NOT NULL,
    "speaker_id"   TEXT NOT NULL,
    "speaker_name" TEXT NOT NULL,
    "text"         TEXT NOT NULL,
    "start_time"   DOUBLE PRECISION NOT NULL,
    "end_time"     DOUBLE PRECISION NOT NULL,
    "word_count"   INTEGER NOT NULL DEFAULT 0,
    "is_final"     BOOLEAN NOT NULL DEFAULT true,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_transcript_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "meeting_transcript_entries_meeting_id_start_time_idx"
    ON "meeting_transcript_entries"("meeting_id", "start_time");

ALTER TABLE "meeting_transcript_entries"
    ADD CONSTRAINT "meeting_transcript_entries_meeting_id_fkey"
    FOREIGN KEY ("meeting_id") REFERENCES "meeting_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- MEETING AI ANALYSES
-- ============================================

CREATE TABLE "meeting_ai_analyses" (
    "id"                    TEXT NOT NULL,
    "meeting_id"            TEXT NOT NULL,
    "summary"               TEXT NOT NULL,
    "key_points"            JSONB NOT NULL,
    "action_items"          JSONB NOT NULL,
    "candidate_scores"      JSONB NOT NULL,
    "sentiment_timeline"    JSONB NOT NULL,
    "speaking_ratio"        JSONB NOT NULL,
    "filler_word_analysis"  JSONB NOT NULL,
    "recommendations"       JSONB NOT NULL,
    "hiring_recommendation" TEXT NOT NULL,
    "hiring_justification"  TEXT NOT NULL,
    "processing_status"     TEXT NOT NULL DEFAULT 'PENDING',
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_ai_analyses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_ai_analyses_meeting_id_key"
    ON "meeting_ai_analyses"("meeting_id");

ALTER TABLE "meeting_ai_analyses"
    ADD CONSTRAINT "meeting_ai_analyses_meeting_id_fkey"
    FOREIGN KEY ("meeting_id") REFERENCES "meeting_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
