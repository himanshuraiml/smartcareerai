-- Phase 4: Technical Simulations — Coding Challenges & Submissions

CREATE TABLE "coding_challenges" (
    "id"           TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "description"  TEXT NOT NULL,
    "difficulty"   "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "category"     TEXT NOT NULL DEFAULT 'algorithms',
    "tags"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "languages"    TEXT[] NOT NULL DEFAULT ARRAY['python','javascript','java','cpp']::TEXT[],
    "starter_code" JSONB NOT NULL,
    "test_cases"   JSONB NOT NULL,
    "constraints"  TEXT,
    "examples"     JSONB,
    "time_limit"   INTEGER NOT NULL DEFAULT 5,
    "memory_limit" INTEGER NOT NULL DEFAULT 128,
    "is_active"    BOOLEAN NOT NULL DEFAULT true,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coding_submissions" (
    "id"             TEXT NOT NULL,
    "user_id"        TEXT NOT NULL,
    "challenge_id"   TEXT NOT NULL,
    "language"       TEXT NOT NULL,
    "code"           TEXT NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',
    "score"          INTEGER,
    "tests_passed"   INTEGER NOT NULL DEFAULT 0,
    "total_tests"    INTEGER NOT NULL DEFAULT 0,
    "execution_time" INTEGER,
    "memory_used"    INTEGER,
    "ai_analysis"    JSONB,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "coding_submissions_user_id_challenge_id_idx"
    ON "coding_submissions"("user_id", "challenge_id");

ALTER TABLE "coding_submissions"
    ADD CONSTRAINT "coding_submissions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coding_submissions"
    ADD CONSTRAINT "coding_submissions_challenge_id_fkey"
    FOREIGN KEY ("challenge_id") REFERENCES "coding_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
