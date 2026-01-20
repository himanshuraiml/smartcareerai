-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'INSTITUTION_ADMIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "admin_for_institution_id" TEXT,
ADD COLUMN     "institution_id" TEXT;
-- ADD COLUMN     "target_job_role_id" TEXT;

-- CreateTable
-- CREATE TABLE "job_role_cache" (
--     "id" TEXT NOT NULL,
--     "job_role_id" TEXT NOT NULL,
--     "certifications" JSONB NOT NULL,
--     "course_suggestions" JSONB NOT NULL,
--     "interview_questions" JSONB,
--     "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "expires_at" TIMESTAMP(3) NOT NULL,

--     CONSTRAINT "job_role_cache_pkey" PRIMARY KEY ("id")
-- );

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "logo_url" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- CREATE TABLE "messages" (
--     "id" TEXT NOT NULL,
--     "sender_id" TEXT NOT NULL,
--     "receiver_id" TEXT NOT NULL,
--     "content" TEXT NOT NULL,
--     "is_read" BOOLEAN NOT NULL DEFAULT false,
--     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

--     CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
-- );

-- CreateIndex
-- CREATE UNIQUE INDEX "job_role_cache_job_role_id_key" ON "job_role_cache"("job_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_domain_key" ON "institutions"("domain");

-- AddForeignKey
-- ALTER TABLE "users" ADD CONSTRAINT "users_target_job_role_id_fkey" FOREIGN KEY ("target_job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_admin_for_institution_id_fkey" FOREIGN KEY ("admin_for_institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE "job_role_cache" ADD CONSTRAINT "job_role_cache_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
