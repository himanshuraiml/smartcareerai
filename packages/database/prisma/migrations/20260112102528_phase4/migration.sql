-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'RECRUITER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'HALTED', 'PAUSED');

-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('RESUME_REVIEW', 'AI_INTERVIEW', 'SKILL_TEST');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE', 'CONSUME', 'GRANT', 'REFUND');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "price_yearly" DECIMAL(10,2) NOT NULL,
    "features" JSONB NOT NULL,
    "razorpay_plan_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "razorpay_customer_id" TEXT,
    "razorpay_subscription_id" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credit_type" "CreditType" NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credit_type" "CreditType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "description" TEXT,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_logo" TEXT,
    "company_size" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "location" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_candidates" (
    "id" TEXT NOT NULL,
    "recruiter_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "notes" TEXT,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'saved',
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_jobs" (
    "id" TEXT NOT NULL,
    "recruiter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT[],
    "required_skills" TEXT[],
    "location" TEXT NOT NULL,
    "location_type" TEXT NOT NULL DEFAULT 'onsite',
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "experience_min" INTEGER,
    "experience_max" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_user_id_key" ON "user_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_credits_user_id_credit_type_key" ON "user_credits"("user_id", "credit_type");

-- CreateIndex
CREATE INDEX "credit_transactions_user_id_credit_type_idx" ON "credit_transactions"("user_id", "credit_type");

-- CreateIndex
CREATE UNIQUE INDEX "recruiters_user_id_key" ON "recruiters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_candidates_recruiter_id_candidate_id_key" ON "saved_candidates"("recruiter_id", "candidate_id");

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiters" ADD CONSTRAINT "recruiters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_candidates" ADD CONSTRAINT "saved_candidates_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_jobs" ADD CONSTRAINT "recruiter_jobs_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
