-- AlterTable: Add stages column to placement_drives
ALTER TABLE "placement_drives" ADD COLUMN "stages" JSONB;

-- AlterTable: Add currentStage column to drive_attendances
ALTER TABLE "drive_attendances" ADD COLUMN "current_stage" TEXT;

-- AlterTable: Add recruiterFlagged and flagReason columns to assessment_attempts
ALTER TABLE "assessment_attempts" ADD COLUMN "recruiter_flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "assessment_attempts" ADD COLUMN "flag_reason" TEXT;
