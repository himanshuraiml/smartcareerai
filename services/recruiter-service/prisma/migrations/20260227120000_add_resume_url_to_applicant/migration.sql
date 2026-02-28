-- Add resume_url and cover_letter columns to recruiter_job_applicants
ALTER TABLE "recruiter_job_applicants" ADD COLUMN IF NOT EXISTS "resume_url" TEXT;
ALTER TABLE "recruiter_job_applicants" ADD COLUMN IF NOT EXISTS "cover_letter" TEXT;
