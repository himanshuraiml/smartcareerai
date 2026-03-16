/*
  Warnings:

  - A unique constraint covering the columns `[booking_token]` on the table `interview_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "booking_expiry" TIMESTAMP(3),
ADD COLUMN     "booking_token" TEXT;

-- CreateTable
CREATE TABLE "interviewer_assignments" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interviewer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scorecard_submissions" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "overall_rating" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "recommendation" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scorecard_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interviewer_assignments_application_id_idx" ON "interviewer_assignments"("application_id");

-- CreateIndex
CREATE INDEX "interviewer_assignments_interviewer_id_idx" ON "interviewer_assignments"("interviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "interviewer_assignments_application_id_interviewer_id_key" ON "interviewer_assignments"("application_id", "interviewer_id");

-- CreateIndex
CREATE INDEX "scorecard_submissions_assignment_id_idx" ON "scorecard_submissions"("assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_sessions_booking_token_key" ON "interview_sessions"("booking_token");

-- AddForeignKey
ALTER TABLE "interviewer_assignments" ADD CONSTRAINT "interviewer_assignments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "recruiter_job_applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviewer_assignments" ADD CONSTRAINT "interviewer_assignments_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorecard_submissions" ADD CONSTRAINT "scorecard_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "interviewer_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
