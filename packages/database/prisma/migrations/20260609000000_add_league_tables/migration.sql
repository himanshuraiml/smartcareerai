-- CreateEnum
CREATE TYPE "LeagueTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateEnum
CREATE TYPE "LeagueOutcome" AS ENUM ('PROMOTED', 'DEMOTED', 'STAYED', 'SHIELDED');

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "tier" "LeagueTier" NOT NULL,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "group_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_memberships" (
    "id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weekly_xp" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "outcome" "LeagueOutcome",
    "has_shield" BOOLEAN NOT NULL DEFAULT false,
    "days_active" INTEGER NOT NULL DEFAULT 0,
    "quizzes_completed" INTEGER NOT NULL DEFAULT 0,
    "perfect_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_league_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" DATE NOT NULL,
    "tier" "LeagueTier" NOT NULL,
    "final_rank" INTEGER NOT NULL,
    "weekly_xp" INTEGER NOT NULL,
    "outcome" "LeagueOutcome" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_league_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leagues_tier_week_start_group_index_key" ON "leagues"("tier", "week_start", "group_index");

-- CreateIndex
CREATE INDEX "leagues_week_start_is_active_idx" ON "leagues"("week_start", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "league_memberships_league_id_user_id_key" ON "league_memberships"("league_id", "user_id");

-- CreateIndex
CREATE INDEX "league_memberships_user_id_idx" ON "league_memberships"("user_id");

-- CreateIndex
CREATE INDEX "league_memberships_league_id_weekly_xp_idx" ON "league_memberships"("league_id", "weekly_xp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_league_history_user_id_week_start_key" ON "user_league_history"("user_id", "week_start");

-- CreateIndex
CREATE INDEX "user_league_history_user_id_idx" ON "user_league_history"("user_id");

-- AddForeignKey
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_league_history" ADD CONSTRAINT "user_league_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
