-- CreateEnum
CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('STANDARD', 'AI_INTERVIEWER', 'PANEL');

-- AlterEnum
ALTER TYPE "MeetingRole" ADD VALUE 'AI_INTERVIEWER';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'EDITOR';

-- AlterTable
ALTER TABLE "assessment_attempts" ADD COLUMN     "proctoring_score" DOUBLE PRECISION,
ADD COLUMN     "snapshots" JSONB;

-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "behavior_metrics" JSONB,
ADD COLUMN     "survey_expiry" TIMESTAMP(3),
ADD COLUMN     "survey_token" TEXT;

-- AlterTable
ALTER TABLE "interviewer_assignments" ADD COLUMN     "panel_id" TEXT;

-- AlterTable
ALTER TABLE "meeting_rooms" ADD COLUMN     "type" "MeetingType" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "recruiter_job_applicants" ADD COLUMN     "bgv_initiated_at" TIMESTAMP(3),
ADD COLUMN     "bgv_report_url" TEXT,
ADD COLUMN     "bgv_status" TEXT,
ADD COLUMN     "offer_letter_generated_at" TIMESTAMP(3),
ADD COLUMN     "offer_letter_url" TEXT;

-- AlterTable
ALTER TABLE "recruiter_jobs" ADD COLUMN     "blind_review_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vertical" TEXT;

-- AlterTable
ALTER TABLE "recruiters" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "panel_interviews" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "duration_mins" INTEGER NOT NULL DEFAULT 60,
    "meet_link" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panel_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_invites" (
    "id" TEXT NOT NULL,
    "drive_id" TEXT NOT NULL,
    "recruiter_id" TEXT NOT NULL,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_sequences" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "stage_trigger" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_sequence_executions" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "step_index" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_sequence_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_surveys" (
    "id" TEXT NOT NULL,
    "interview_session_id" TEXT NOT NULL,
    "nps_score" INTEGER NOT NULL,
    "responses" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_hire_check_ins" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "day_n" INTEGER NOT NULL,
    "performance_rating" INTEGER NOT NULL,
    "retention_status" TEXT NOT NULL,
    "notes" TEXT,
    "submitted_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_hire_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_ats_configs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "outbound_url" TEXT,
    "api_key" TEXT,
    "field_mappings" JSONB NOT NULL DEFAULT '{}',
    "last_sync_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_ats_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_ats_logs" (
    "id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_ats_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bgv_logs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "external_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "report_url" TEXT,
    "webhook_data" JSONB,
    "initiated_by" TEXT NOT NULL,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bgv_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cover_image" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "read_time" TEXT,
    "keywords" TEXT[],
    "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "author_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "reject_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "panel_interviews_application_id_idx" ON "panel_interviews"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "drive_invites_drive_id_recruiter_id_key" ON "drive_invites"("drive_id", "recruiter_id");

-- CreateIndex
CREATE INDEX "message_sequence_executions_application_id_idx" ON "message_sequence_executions"("application_id");

-- CreateIndex
CREATE INDEX "message_sequence_executions_status_idx" ON "message_sequence_executions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_surveys_interview_session_id_key" ON "candidate_surveys"("interview_session_id");

-- CreateIndex
CREATE INDEX "bgv_logs_application_id_idx" ON "bgv_logs"("application_id");

-- CreateIndex
CREATE INDEX "bgv_logs_status_idx" ON "bgv_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_published_at_idx" ON "blog_posts"("status", "published_at");

-- CreateIndex
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts"("author_id");

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");

-- CreateIndex
CREATE UNIQUE INDEX "interview_sessions_survey_token_key" ON "interview_sessions"("survey_token");

-- AddForeignKey
ALTER TABLE "interviewer_assignments" ADD CONSTRAINT "interviewer_assignments_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "panel_interviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_invites" ADD CONSTRAINT "drive_invites_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_invites" ADD CONSTRAINT "drive_invites_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_sequences" ADD CONSTRAINT "message_sequences_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "recruiter_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_sequence_executions" ADD CONSTRAINT "message_sequence_executions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "recruiter_job_applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_sequence_executions" ADD CONSTRAINT "message_sequence_executions_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "message_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_surveys" ADD CONSTRAINT "candidate_surveys_interview_session_id_fkey" FOREIGN KEY ("interview_session_id") REFERENCES "interview_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_hire_check_ins" ADD CONSTRAINT "post_hire_check_ins_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "recruiter_job_applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_ats_configs" ADD CONSTRAINT "external_ats_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_ats_logs" ADD CONSTRAINT "external_ats_logs_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "external_ats_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
