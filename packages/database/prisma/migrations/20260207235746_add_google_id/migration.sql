/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('USER_REGISTER', 'USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_RESET', 'RESUME_UPLOAD', 'RESUME_ANALYSIS', 'INTERVIEW_START', 'INTERVIEW_COMPLETE', 'TEST_START', 'TEST_COMPLETE', 'SUBSCRIPTION_CHANGE', 'CREDIT_PURCHASE', 'ADMIN_ACTION', 'SYSTEM_ALERT', 'SETTINGS_CHANGE');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "EmailCategory" AS ENUM ('INVITATION', 'NEWSLETTER', 'PROMOTIONAL', 'TRANSACTIONAL', 'NOTIFICATION', 'GENERAL');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('INSTITUTION_ADMIN_INVITE', 'STUDENT_WELCOME', 'RECRUITER_WELCOME', 'NEWSLETTER', 'PROMOTIONAL', 'PASSWORD_RESET', 'VERIFICATION', 'NOTIFICATION', 'BULK', 'OTHER');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'BOUNCED');

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "interview_questions" ADD COLUMN     "bank_question_id" TEXT;

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'seeded';

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "razorpay_plan_id_yearly" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_id" TEXT;

-- CreateTable
CREATE TABLE "interview_bank_questions" (
    "id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "ideal_answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "question_type" "InterviewType" NOT NULL,
    "job_role_id" TEXT,
    "tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_bank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "message" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'SUCCESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT,
    "category" "EmailCategory" NOT NULL DEFAULT 'GENERAL',
    "variables" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "template_id" TEXT,
    "recipient_id" TEXT,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "email_type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "metadata" JSONB,
    "sent_by" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_bank_questions_job_role_id_question_type_difficul_idx" ON "interview_bank_questions"("job_role_id", "question_type", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "activity_logs_type_idx" ON "activity_logs"("type");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");

-- CreateIndex
CREATE INDEX "email_logs_recipient_email_idx" ON "email_logs"("recipient_email");

-- CreateIndex
CREATE INDEX "email_logs_email_type_idx" ON "email_logs"("email_type");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- AddForeignKey
ALTER TABLE "interview_bank_questions" ADD CONSTRAINT "interview_bank_questions_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
