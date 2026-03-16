/*
  Warnings:

  - The `status` column on the `challenge_submissions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `starter_code` on the `coding_challenges` table. All the data in the column will be lost.
  - You are about to drop the column `test_cases` on the `coding_challenges` table. All the data in the column will be lost.
  - The `status` column on the `user_lab_progress` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `starterCode` to the `coding_challenges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testCases` to the `coding_challenges` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('SUBSCRIPTION', 'CREDITS', 'ALL');

-- CreateEnum
CREATE TYPE "DriveStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DriveStage" AS ENUM ('REGISTRATION', 'ONLINE_TEST', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'OFFER');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'OPEN_ENDED', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EVALUATING', 'FLAGGED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'TPO';
ALTER TYPE "UserRole" ADD VALUE 'DEPT_COORDINATOR';
ALTER TYPE "UserRole" ADD VALUE 'PLACEMENT_STAFF';
ALTER TYPE "UserRole" ADD VALUE 'STUDENT_VOLUNTEER';

-- DropForeignKey
ALTER TABLE "challenge_submissions" DROP CONSTRAINT "challenge_submissions_challenge_id_fkey";

-- DropForeignKey
ALTER TABLE "challenge_submissions" DROP CONSTRAINT "challenge_submissions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "labs" DROP CONSTRAINT "labs_track_id_fkey";

-- DropForeignKey
ALTER TABLE "user_lab_progress" DROP CONSTRAINT "user_lab_progress_lab_id_fkey";

-- DropForeignKey
ALTER TABLE "user_lab_progress" DROP CONSTRAINT "user_lab_progress_track_id_fkey";

-- DropForeignKey
ALTER TABLE "user_lab_progress" DROP CONSTRAINT "user_lab_progress_user_id_fkey";

-- DropIndex
DROP INDEX "copilot_suggestions_session_id_idx";

-- DropIndex
DROP INDEX "labs_track_id_order_key";

-- AlterTable
ALTER TABLE "challenge_submissions" DROP COLUMN "status",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "coding_challenges" DROP COLUMN "starter_code",
DROP COLUMN "test_cases",
ADD COLUMN     "is_custom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organization_id" TEXT,
ADD COLUMN     "recruiter_id" TEXT,
ADD COLUMN     "starterCode" JSONB NOT NULL,
ADD COLUMN     "testCases" JSONB NOT NULL,
ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "copilot_sessions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lab_tracks" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recruiter_job_applicants" ADD COLUMN     "cover_letter" TEXT,
ADD COLUMN     "current_pipeline_step" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resume_url" TEXT;

-- AlterTable
ALTER TABLE "recruiter_jobs" ADD COLUMN     "allowed_batches" INTEGER[],
ADD COLUMN     "allowed_branches" TEXT[],
ADD COLUMN     "job_type" TEXT,
ADD COLUMN     "max_backlogs" INTEGER,
ADD COLUMN     "min_cgpa" DOUBLE PRECISION,
ADD COLUMN     "pipeline_steps" JSONB,
ADD COLUMN     "salary_package" TEXT;

-- AlterTable
ALTER TABLE "user_lab_progress" DROP COLUMN "status",
ADD COLUMN     "status" "LabStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "weekly_challenges" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "placement_policies" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "dream_company_threshold" INTEGER NOT NULL DEFAULT 10,
    "max_offers_allowed" INTEGER NOT NULL DEFAULT 2,
    "core_company_branches" TEXT[],
    "internship_conversion_rules" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_partnerships" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "partnership_tier" TEXT,
    "mou_status" TEXT,
    "mou_expiry_date" TIMESTAMP(3),
    "recruiter_contacts" JSONB,
    "hiring_history" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_partnerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_feedbacks" (
    "id" TEXT NOT NULL,
    "partnership_id" TEXT NOT NULL,
    "recruiter_name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "backlogs" INTEGER NOT NULL DEFAULT 0,
    "skills" TEXT[],
    "readiness_score" DOUBLE PRECISION DEFAULT 0,
    "at_risk_level" TEXT DEFAULT 'LOW',
    "last_score_calculation" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_alerts" (
    "id" TEXT NOT NULL,
    "student_profile_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_integrations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'google',
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expiry_date" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DOUBLE PRECISION NOT NULL,
    "applicable_to" "CouponType" NOT NULL DEFAULT 'ALL',
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expiry_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_drives" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "DriveStatus" NOT NULL DEFAULT 'UPCOMING',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "drive_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_attendances" (
    "id" TEXT NOT NULL,
    "drive_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "scanned_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NOT_SCANNED',

    CONSTRAINT "drive_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_panels" (
    "id" TEXT NOT NULL,
    "drive_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_panel_members" (
    "id" TEXT NOT NULL,
    "panel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "interview_panel_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_schedules" (
    "id" TEXT NOT NULL,
    "drive_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "round_name" TEXT NOT NULL,
    "room_id" TEXT,
    "room_name" TEXT,
    "panel_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "interview_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_schedule_students" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "attendanceStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "interviewStatus" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "score" DOUBLE PRECISION,
    "feedback" TEXT,

    CONSTRAINT "interview_schedule_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hod_name" TEXT,
    "hod_email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_roles" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "department_id" TEXT,
    "assigned_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "total_steps" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approval_chain" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT,
    "user_role" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_bank_questions" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "options" JSONB,
    "correctAnswer" TEXT,
    "evaluationRubric" JSONB,
    "explanation" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_bank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_templates" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "total_questions" INTEGER NOT NULL DEFAULT 20,
    "difficulty_distribution" JSONB NOT NULL,
    "required_skills" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "analytical_score" INTEGER,
    "behavioral_score" INTEGER,
    "overall_score" INTEGER,
    "behavioral_insights" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_answers" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "is_correct" BOOLEAN,
    "score" INTEGER,
    "feedback" TEXT,

    CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proctoring_logs" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "snapshot_url" TEXT,

    CONSTRAINT "proctoring_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PlacementDriveToRecruiterJob" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "placement_policies_institution_id_key" ON "placement_policies"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_integrations_organization_id_key" ON "calendar_integrations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_user_id_job_id_key" ON "job_applications"("user_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "drive_attendances_qr_code_key" ON "drive_attendances"("qr_code");

-- CreateIndex
CREATE UNIQUE INDEX "drive_attendances_drive_id_student_id_key" ON "drive_attendances"("drive_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_schedule_students_schedule_id_student_id_key" ON "interview_schedule_students"("schedule_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_institution_id_code_key" ON "departments"("institution_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "placement_roles_institution_id_name_key" ON "placement_roles"("institution_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "placement_user_roles_user_id_role_id_institution_id_key" ON "placement_user_roles"("user_id", "role_id", "institution_id");

-- CreateIndex
CREATE INDEX "approval_workflows_institution_id_entity_type_status_idx" ON "approval_workflows"("institution_id", "entity_type", "status");

-- CreateIndex
CREATE INDEX "audit_logs_institution_id_created_at_idx" ON "audit_logs"("institution_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_templates_job_id_key" ON "assessment_templates"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "_PlacementDriveToRecruiterJob_AB_unique" ON "_PlacementDriveToRecruiterJob"("A", "B");

-- CreateIndex
CREATE INDEX "_PlacementDriveToRecruiterJob_B_index" ON "_PlacementDriveToRecruiterJob"("B");

-- AddForeignKey
ALTER TABLE "placement_policies" ADD CONSTRAINT "placement_policies_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_partnerships" ADD CONSTRAINT "company_partnerships_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_feedbacks" ADD CONSTRAINT "recruiter_feedbacks_partnership_id_fkey" FOREIGN KEY ("partnership_id") REFERENCES "company_partnerships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_alerts" ADD CONSTRAINT "placement_alerts_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_alerts" ADD CONSTRAINT "placement_alerts_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_challenges" ADD CONSTRAINT "coding_challenges_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_challenges" ADD CONSTRAINT "coding_challenges_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "lab_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lab_progress" ADD CONSTRAINT "user_lab_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lab_progress" ADD CONSTRAINT "user_lab_progress_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "lab_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lab_progress" ADD CONSTRAINT "user_lab_progress_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "weekly_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "recruiter_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "placement_drives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_attendances" ADD CONSTRAINT "drive_attendances_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_attendances" ADD CONSTRAINT "drive_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_panels" ADD CONSTRAINT "interview_panels_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_panel_members" ADD CONSTRAINT "interview_panel_members_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "interview_panels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_panel_members" ADD CONSTRAINT "interview_panel_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_drive_id_fkey" FOREIGN KEY ("drive_id") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "recruiter_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "interview_panels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedule_students" ADD CONSTRAINT "interview_schedule_students_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "interview_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedule_students" ADD CONSTRAINT "interview_schedule_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_roles" ADD CONSTRAINT "placement_roles_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "placement_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_user_roles" ADD CONSTRAINT "placement_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_user_roles" ADD CONSTRAINT "placement_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "placement_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_user_roles" ADD CONSTRAINT "placement_user_roles_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_user_roles" ADD CONSTRAINT "placement_user_roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "recruiter_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "assessment_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "assessment_bank_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_logs" ADD CONSTRAINT "proctoring_logs_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlacementDriveToRecruiterJob" ADD CONSTRAINT "_PlacementDriveToRecruiterJob_A_fkey" FOREIGN KEY ("A") REFERENCES "placement_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlacementDriveToRecruiterJob" ADD CONSTRAINT "_PlacementDriveToRecruiterJob_B_fkey" FOREIGN KEY ("B") REFERENCES "recruiter_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "challenge_submissions_challenge_user_key" RENAME TO "challenge_submissions_challenge_id_user_id_key";

-- RenameIndex
ALTER INDEX "challenge_submissions_user_idx" RENAME TO "challenge_submissions_user_id_idx";

-- RenameIndex
ALTER INDEX "user_lab_progress_user_track_idx" RENAME TO "user_lab_progress_user_id_track_id_idx";

-- RenameIndex
ALTER INDEX "weekly_challenges_week_year_key" RENAME TO "weekly_challenges_week_number_year_key";
