-- Migration: Add track to availability_overrides
-- Adds per-track override support for admin schedule editor

-- Add track column to availability_overrides (nullable, for backward compat)
ALTER TABLE "availability_overrides" ADD COLUMN "track" TEXT;

-- Drop old unique constraint (teacherId, date)
ALTER TABLE "availability_overrides" DROP CONSTRAINT "availability_overrides_teacher_id_date_key";

-- Add new unique constraint (teacherId, date, track)
-- PostgreSQL treats NULL != NULL in unique constraints, so existing
-- rows with track=NULL coexist without conflict.
ALTER TABLE "availability_overrides"
ADD CONSTRAINT "availability_overrides_teacher_id_date_track_key"
UNIQUE ("teacher_id", "date", "track");
