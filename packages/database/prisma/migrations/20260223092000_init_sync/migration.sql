-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'PLACED';

-- AlterTable
ALTER TABLE "recruiter_jobs" ADD COLUMN     "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "target_institution_id" TEXT;

-- CreateTable
CREATE TABLE "recruiter_job_applicants" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_job_applicants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_job_applicants_job_id_candidate_id_key" ON "recruiter_job_applicants"("job_id", "candidate_id");

-- AddForeignKey
ALTER TABLE "recruiter_jobs" ADD CONSTRAINT "recruiter_jobs_target_institution_id_fkey" FOREIGN KEY ("target_institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_job_applicants" ADD CONSTRAINT "recruiter_job_applicants_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "recruiter_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_job_applicants" ADD CONSTRAINT "recruiter_job_applicants_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
