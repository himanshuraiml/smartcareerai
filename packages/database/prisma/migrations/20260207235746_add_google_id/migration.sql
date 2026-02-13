/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ActivityType" AS ENUM ('USER_REGISTER', 'USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_RESET', 'RESUME_UPLOAD', 'RESUME_ANALYSIS', 'INTERVIEW_START', 'INTERVIEW_COMPLETE', 'TEST_START', 'TEST_COMPLETE', 'SUBSCRIPTION_CHANGE', 'CREDIT_PURCHASE', 'ADMIN_ACTION', 'SYSTEM_ALERT', 'SETTINGS_CHANGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ActivityStatus" AS ENUM ('SUCCESS', 'WARNING', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EmailCategory" AS ENUM ('INVITATION', 'NEWSLETTER', 'PROMOTIONAL', 'TRANSACTIONAL', 'NOTIFICATION', 'GENERAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EmailType" AS ENUM ('INSTITUTION_ADMIN_INVITE', 'STUDENT_WELCOME', 'RECRUITER_WELCOME', 'NEWSLETTER', 'PROMOTIONAL', 'PASSWORD_RESET', 'VERIFICATION', 'NOTIFICATION', 'BULK', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'BOUNCED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING';

-- AlterTable: interview_questions
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interview_questions' AND column_name = 'bank_question_id') THEN
        ALTER TABLE "interview_questions" ADD COLUMN "bank_question_id" TEXT;
    END IF;
END $$;

-- AlterTable: skills
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'skills' AND column_name = 'source') THEN
        ALTER TABLE "skills" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'seeded';
    END IF;
END $$;

-- AlterTable: subscription_plans
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'razorpay_plan_id_yearly') THEN
        ALTER TABLE "subscription_plans" ADD COLUMN "razorpay_plan_id_yearly" TEXT;
    END IF;
END $$;

-- AlterTable: users
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id') THEN
        ALTER TABLE "users" ADD COLUMN "google_id" TEXT;
    END IF;
END $$;

-- CreateTable: interview_bank_questions
CREATE TABLE IF NOT EXISTS "interview_bank_questions" (
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

-- CreateTable: system_settings
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
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

-- CreateTable: email_templates
CREATE TABLE IF NOT EXISTS "email_templates" (
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

-- CreateTable: email_logs
CREATE TABLE IF NOT EXISTS "email_logs" (
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
CREATE INDEX IF NOT EXISTS "interview_bank_questions_job_role_id_question_type_difficul_idx" ON "interview_bank_questions"("job_role_id", "question_type", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_logs_type_idx" ON "activity_logs"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "email_templates_name_key" ON "email_templates"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_logs_recipient_email_idx" ON "email_logs"("recipient_email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_logs_email_type_idx" ON "email_logs"("email_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_logs_created_at_idx" ON "email_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_key" ON "users"("google_id");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'interview_bank_questions_job_role_id_fkey') THEN
        ALTER TABLE "interview_bank_questions" ADD CONSTRAINT "interview_bank_questions_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'email_logs_template_id_fkey') THEN
        ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
