-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER');

-- AlterEnum
ALTER TYPE "BadgeType" ADD VALUE 'MASTER';

-- AlterTable
ALTER TABLE "test_questions" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'seeded';

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quiz_question_ids" TEXT[],
    "quiz_skill_id" TEXT,
    "insight_id" TEXT,
    "sprint_skill_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenge_completions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "quiz_completed" BOOLEAN NOT NULL DEFAULT false,
    "quiz_score" INTEGER,
    "quiz_correct" INTEGER,
    "quiz_total" INTEGER,
    "quiz_time_ms" INTEGER,
    "insight_read" BOOLEAN NOT NULL DEFAULT false,
    "insight_reaction" TEXT,
    "sprint_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_perfect_day" BOOLEAN NOT NULL DEFAULT false,
    "total_xp_earned" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_challenge_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_insights" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'curated',
    "tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "used_on_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_masteries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "level" "MasteryLevel" NOT NULL DEFAULT 'BEGINNER',
    "current_level_xp" INTEGER NOT NULL DEFAULT 0,
    "required_level_xp" INTEGER NOT NULL DEFAULT 100,
    "quizzes_completed" INTEGER NOT NULL DEFAULT 0,
    "quiz_avg_score" DOUBLE PRECISION,
    "last_quiz_at" TIMESTAMP(3),
    "can_level_up" BOOLEAN NOT NULL DEFAULT false,
    "level_up_cooldown" TIMESTAMP(3),
    "level_reached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_masteries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_sprint_cards" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_sprint_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sprint_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "next_review_at" TIMESTAMP(3),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "last_review_at" TIMESTAMP(3),

    CONSTRAINT "user_sprint_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_date_key" ON "daily_challenges"("date");

-- CreateIndex
CREATE INDEX "daily_challenges_date_idx" ON "daily_challenges"("date");

-- CreateIndex
CREATE INDEX "daily_challenge_completions_user_id_completed_at_idx" ON "daily_challenge_completions"("user_id", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenge_completions_user_id_challenge_id_key" ON "daily_challenge_completions"("user_id", "challenge_id");

-- CreateIndex
CREATE INDEX "career_insights_is_active_used_on_date_idx" ON "career_insights"("is_active", "used_on_date");

-- CreateIndex
CREATE INDEX "skill_masteries_user_id_idx" ON "skill_masteries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_masteries_user_id_skill_id_key" ON "skill_masteries"("user_id", "skill_id");

-- CreateIndex
CREATE INDEX "skill_sprint_cards_skill_id_difficulty_idx" ON "skill_sprint_cards"("skill_id", "difficulty");

-- CreateIndex
CREATE INDEX "user_sprint_progress_user_id_next_review_at_idx" ON "user_sprint_progress"("user_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_sprint_progress_user_id_card_id_key" ON "user_sprint_progress"("user_id", "card_id");

-- AddForeignKey
ALTER TABLE "daily_challenge_completions" ADD CONSTRAINT "daily_challenge_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_challenge_completions" ADD CONSTRAINT "daily_challenge_completions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "daily_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_masteries" ADD CONSTRAINT "skill_masteries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_masteries" ADD CONSTRAINT "skill_masteries_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_sprint_cards" ADD CONSTRAINT "skill_sprint_cards_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sprint_progress" ADD CONSTRAINT "user_sprint_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
