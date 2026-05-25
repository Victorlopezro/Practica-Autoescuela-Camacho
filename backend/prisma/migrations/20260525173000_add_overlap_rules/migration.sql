-- Migration: Add overlap rules to replace hardcoded overlap blocking
-- These rules let the rule engine decide which license combinations can overlap
-- instead of blocking ALL overlaps in code.

-- 1. Allow A1 + A2 overlap (student A1, overlapping has A2)
INSERT INTO scheduling_rules (id, name, natural_language, structured_rules, rule_type, action, priority, enabled, created_by_id, updated_at)
VALUES (
  gen_random_uuid(),
  'Solapamiento A1→A2 permitido',
  'Alumnos con permiso A1 pueden solaparse con alumnos A2 en el mismo horario (máx 2)',
  '{"conditions":[{"field":"student.licenseType","operator":"eq","value":"A1"},{"field":"overlappingLicenseTypes","operator":"contains","value":"A2"}],"logic":"all"}',
  'overlap',
  'allow',
  10,
  true,
  'u-admin-0001',
  NOW()
);

-- 2. Allow A2 + A1 overlap (student A2, overlapping has A1)
INSERT INTO scheduling_rules (id, name, natural_language, structured_rules, rule_type, action, priority, enabled, created_by_id, updated_at)
VALUES (
  gen_random_uuid(),
  'Solapamiento A2→A1 permitido',
  'Alumnos con permiso A2 pueden solaparse con alumnos A1 en el mismo horario (máx 2)',
  '{"conditions":[{"field":"student.licenseType","operator":"eq","value":"A2"},{"field":"overlappingLicenseTypes","operator":"contains","value":"A1"}],"logic":"all"}',
  'overlap',
  'allow',
  10,
  true,
  'u-admin-0001',
  NOW()
);

-- 3. Allow AM + A2 overlap (student AM, overlapping has A2)
INSERT INTO scheduling_rules (id, name, natural_language, structured_rules, rule_type, action, priority, enabled, created_by_id, updated_at)
VALUES (
  gen_random_uuid(),
  'Solapamiento AM→A2 permitido',
  'Alumnos con permiso AM pueden solaparse con alumnos A2 en el mismo horario (máx 2)',
  '{"conditions":[{"field":"student.licenseType","operator":"eq","value":"AM"},{"field":"overlappingLicenseTypes","operator":"contains","value":"A2"}],"logic":"all"}',
  'overlap',
  'allow',
  10,
  true,
  'u-admin-0001',
  NOW()
);

-- 4. Allow A2 + AM overlap (student A2, overlapping has AM)
INSERT INTO scheduling_rules (id, name, natural_language, structured_rules, rule_type, action, priority, enabled, created_by_id, updated_at)
VALUES (
  gen_random_uuid(),
  'Solapamiento A2→AM permitido',
  'Alumnos con permiso A2 pueden solaparse con alumnos AM en el mismo horario (máx 2)',
  '{"conditions":[{"field":"student.licenseType","operator":"eq","value":"A2"},{"field":"overlappingLicenseTypes","operator":"contains","value":"AM"}],"logic":"all"}',
  'overlap',
  'allow',
  10,
  true,
  'u-admin-0001',
  NOW()
);

-- 5. Block all other overlaps (default — replaces the hardcoded overlap check)
INSERT INTO scheduling_rules (id, name, natural_language, structured_rules, rule_type, action, priority, enabled, created_by_id, updated_at)
VALUES (
  gen_random_uuid(),
  'Bloquear solapamientos no permitidos',
  'Bloquea cualquier solapamiento de horario entre alumnos que no esté explícitamente permitido',
  '{"conditions":[{"field":"overlappingCount","operator":"gt","value":0}],"logic":"all"}',
  'overlap',
  'block',
  100,
  true,
  'u-admin-0001',
  NOW()
);
