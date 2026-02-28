-- B2B Expansion: Migration for Job Approval Workflow and ATS Pipeline
-- Apply this migration after backing up the database.

-- Step 1: Add approval_status enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApprovalStatus') THEN
        CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
END $$;

-- Step 2: Add approval_status column to recruiter_jobs table (default PENDING)
ALTER TABLE recruiter_jobs
    ADD COLUMN IF NOT EXISTS approval_status "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- Step 3: Create the recruiter_job_applicants table for the ATS Kanban pipeline
CREATE TABLE IF NOT EXISTS recruiter_job_applicants (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id       UUID        NOT NULL REFERENCES recruiter_jobs(id) ON DELETE CASCADE,
    candidate_id UUID        NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'APPLIED',
    applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT recruiter_job_applicants_job_candidate_unique UNIQUE (job_id, candidate_id)
);

-- Step 4: Index for fast lookups by job
CREATE INDEX IF NOT EXISTS idx_rja_job_id     ON recruiter_job_applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_rja_candidate  ON recruiter_job_applicants(candidate_id);
CREATE INDEX IF NOT EXISTS idx_rj_approval    ON recruiter_jobs(approval_status);

-- Step 5: Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_recruiter_job_applicants_updated_at'
    ) THEN
        CREATE TRIGGER update_recruiter_job_applicants_updated_at
            BEFORE UPDATE ON recruiter_job_applicants
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
