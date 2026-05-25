-- Add deadline reservation rule
-- Blocks bookings made after 18:00 (or BOOKING_DEADLINE_HOUR) the day before the slot

INSERT INTO scheduling_rules (id, name, natural_language, structured_rules, rule_type, action, priority, enabled, created_by_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'Deadline de reserva',
  'No permitir reservas con menos de 24h de antelación (corte a las 18:00 del día anterior). Configurable vía BOOKING_DEADLINE_HOUR.',
  '{"conditions":[{"field":"isDeadlinePassed","operator":"eq","value":true}],"logic":"any"}'::jsonb,
  'availability',
  'block',
  1,
  true,
  id,
  NOW(),
  NOW()
FROM users WHERE role = 'admin' LIMIT 1
-- Avoid duplicate if already inserted
ON CONFLICT DO NOTHING;
