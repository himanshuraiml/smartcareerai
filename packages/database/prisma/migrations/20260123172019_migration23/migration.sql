-- CreateEnum
CREATE TYPE "TrackedEmailType" AS ENUM ('APPLICATION_RECEIVED', 'INTERVIEW', 'OFFER', 'REJECTION', 'UPDATE', 'OTHER');

-- AlterTable
ALTER TABLE "interview_questions" ADD COLUMN     "improved_answer" TEXT,
ADD COLUMN     "metrics" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "target_job_role_id" TEXT;

-- CreateTable
CREATE TABLE "job_role_cache" (
    "id" TEXT NOT NULL,
    "job_role_id" TEXT NOT NULL,
    "certifications" JSONB NOT NULL,
    "course_suggestions" JSONB NOT NULL,
    "interview_questions" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_role_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expiry" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracked_emails" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "snippet" TEXT,
    "type" "TrackedEmailType" NOT NULL DEFAULT 'OTHER',
    "company_name" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracked_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_role_cache_job_role_id_key" ON "job_role_cache"("job_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_connections_user_id_key" ON "email_connections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tracked_emails_user_id_message_id_key" ON "tracked_emails"("user_id", "message_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_target_job_role_id_fkey" FOREIGN KEY ("target_job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_role_cache" ADD CONSTRAINT "job_role_cache_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
