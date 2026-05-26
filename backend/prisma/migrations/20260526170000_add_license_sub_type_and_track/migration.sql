-- Migration: Add license_sub_type to students and track to teacher_availability
-- Adds track-based separation for motorcycle instructor availability

-- Add license_sub_type column to students (nullable, for A1/A2 students)
ALTER TABLE "students" ADD COLUMN "license_sub_type" TEXT;

-- Add track column to teacher_availability (nullable, for backward compat)
ALTER TABLE "teacher_availability" ADD COLUMN "track" TEXT;

-- Drop old unique constraint (teacherId, dayOfWeek)
ALTER TABLE "teacher_availability" DROP CONSTRAINT "teacher_availability_teacher_id_day_of_week_key";

-- Add new unique constraint (teacherId, dayOfWeek, track)
-- PostgreSQL treats NULL != NULL in unique constraints, so existing
-- rows with track=NULL coexist without conflict.
ALTER TABLE "teacher_availability"
ADD CONSTRAINT "teacher_availability_teacher_id_day_of_week_track_key"
UNIQUE ("teacher_id", "day_of_week", "track");
