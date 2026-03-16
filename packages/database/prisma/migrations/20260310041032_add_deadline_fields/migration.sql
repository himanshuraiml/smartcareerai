-- AlterTable
ALTER TABLE "assessment_templates" ADD COLUMN     "assessment_deadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "interview_sessions" ADD COLUMN     "invite_expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "recruiter_jobs" ADD COLUMN     "application_deadline" TIMESTAMP(3);
