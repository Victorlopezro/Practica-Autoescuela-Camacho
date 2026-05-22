-- Seed initial scheduling rules
-- Creates the 3 base rules that implement the current hardcoded grid behaviour

INSERT INTO scheduling_rules (id, name, natural_language, structured_rules, rule_type, action, priority, enabled, created_by_id, created_at, updated_at)
VALUES
-- 1. Horario laboral: solo clases 9:00-14:00 y 16:00-20:00
-- Blocks slots outside these hours
(gen_random_uuid(), 'Horario laboral',
 'Solo se pueden dar clases en horario de mañana (9:00-14:00) y tarde (16:00-20:00). Fuera de ese horario no hay clases.',
 '{"conditions":[{"field":"time","operator":"notIn","value":["09:00-14:00","16:00-20:00"]}],"logic":"any"}',
 'availability', 'block', 10, true,
 (SELECT id FROM users WHERE role = 'admin' LIMIT 1), NOW(), NOW()),

-- 2. Incremento de cuadrícula: si quedan <=3 clases, duración recomendada 90min
-- Warns when student has few remaining classes but session is short
(gen_random_uuid(), 'Incremento de cuadrícula',
 'Cuando al alumno le queden 3 clases o menos, la sesión debe ser de 90 minutos (doble).',
 '{"conditions":[{"field":"student.remainingClasses","operator":"lte","value":3},{"field":"duration","operator":"lt","value":90}],"logic":"all"}',
 'duration', 'warn', 50, true,
 (SELECT id FROM users WHERE role = 'admin' LIMIT 1), NOW(), NOW()),

-- 3. Restricción doble sesión: alumnos con más de 5 clases restantes pueden hacer doble sesión
-- Warns when a double session is created but student doesn't have enough remaining classes for the pattern
(gen_random_uuid(), 'Restricción doble sesión',
 'Los alumnos con más de 5 clases restantes pueden reservar sesiones dobles (90min).',
 '{"conditions":[{"field":"student.remainingClasses","operator":"gt","value":5},{"field":"duration","operator":"gte","value":90}],"logic":"all"}',
 'overlap', 'warn', 60, true,
 (SELECT id FROM users WHERE role = 'admin' LIMIT 1), NOW(), NOW());
