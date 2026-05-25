-- Add composite indexes on reservations for calendar queries
CREATE INDEX IF NOT EXISTS reservations_teacher_id_start_time_idx ON reservations (teacher_id, start_time);
CREATE INDEX IF NOT EXISTS reservations_student_id_start_time_idx ON reservations (student_id, start_time);
