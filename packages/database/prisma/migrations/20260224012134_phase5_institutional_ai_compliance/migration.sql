-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'HR', 'HIRING_MANAGER', 'INTERVIEWER', 'RECRUITER');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'PIPELINE_MOVE';
ALTER TYPE "ActivityType" ADD VALUE 'EVALUATION_RUN';
ALTER TYPE "ActivityType" ADD VALUE 'GDPR_EXPORT';
ALTER TYPE "ActivityType" ADD VALUE 'GDPR_DELETE';
ALTER TYPE "ActivityType" ADD VALUE 'COMPLIANCE_AUDIT';

-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "is_replay_available" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "job_id" TEXT,
ADD COLUMN     "replay_transcript_url" TEXT,
ADD COLUMN     "replay_url" TEXT;

-- AlterTable
ALTER TABLE "recruiter_job_applicants" ADD COLUMN     "acceptance_likelihood" DOUBLE PRECISION,
ADD COLUMN     "ai_evaluation" JSONB,
ADD COLUMN     "bias_flags" JSONB,
ADD COLUMN     "candidate_summary" TEXT,
ADD COLUMN     "dropout_risk" TEXT,
ADD COLUMN     "fit_score" DOUBLE PRECISION,
ADD COLUMN     "overall_score" DOUBLE PRECISION,
ADD COLUMN     "salary_recommendation" INTEGER,
ADD COLUMN     "shortlist_justification" TEXT;

-- AlterTable
ALTER TABLE "recruiter_jobs" ADD COLUMN     "ai_interview_config" JSONB,
ADD COLUMN     "auto_generated_jd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organization_id" TEXT,
ADD COLUMN     "salary_band_max" INTEGER,
ADD COLUMN     "salary_band_min" INTEGER;

-- AlterTable
ALTER TABLE "recruiters" ADD COLUMN     "org_role" "OrgRole" NOT NULL DEFAULT 'RECRUITER',
ADD COLUMN     "organization_id" TEXT;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "domain_verification_token" TEXT,
    "logo_url" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "custom_domain" TEXT,
    "is_white_label" BOOLEAN NOT NULL DEFAULT false,
    "theme" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ats_integrations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "webhook_url" TEXT,
    "webhook_secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ats_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "response_status" INTEGER,
    "response_body" TEXT,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weights" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scoring_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_placements" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "salary_offered" INTEGER,
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_placements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_custom_domain_key" ON "organizations"("custom_domain");

-- CreateIndex
CREATE UNIQUE INDEX "ats_integrations_organization_id_platform_key" ON "ats_integrations"("organization_id", "platform");

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "recruiter_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ats_integrations" ADD CONSTRAINT "ats_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "ats_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_templates" ADD CONSTRAINT "scoring_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiters" ADD CONSTRAINT "recruiters_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_jobs" ADD CONSTRAINT "recruiter_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_placements" ADD CONSTRAINT "campus_placements_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_placements" ADD CONSTRAINT "campus_placements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
