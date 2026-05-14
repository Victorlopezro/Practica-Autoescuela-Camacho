# Reglas de Colaboración

## Agentes vs Skills

| Aspecto | Agente | Skill |
|---------|--------|-------|
| Decide | ✅ Arquitectura, calidad, seguridad | ❌ Sigue instrucciones |
| Ejecuta patrones | ❌ Delega a skills | ✅ Genera código |
| Revisa resultados | ✅ Valida calidad | ❌ No se revisa a sí misma |
| Tiene criterio | ✅ Sí | ❌ No |
| Puede rechazar cambios | ✅ Sí | ❌ No |
| Conoce el proyecto globalmente | ✅ Sí | ❌ Solo su dominio |

## Protocolo de Cambio

1. **Agente** analiza y decide qué hacer
2. **Agente** selecciona skill(s) aplicable(s)
3. **Agente** inyecta SKILL.md en el prompt del subagente
4. **Skill** ejecuta el patrón y genera código
5. **Agente** revisa el resultado
6. **QA** valida calidad antes de merge

## Ownership

| Artefacto | Responsable |
|-----------|-------------|
| Arquitectura global | architecture-guardian |
| Calidad del código | qa-refactor |
| Seguridad y RBAC | security-permissions |
| Backend y APIs | backend-preparation |
| Base de datos | database-concurrency |
| Infraestructura | devops-preparation |
| Generación de CRUDs | skill: crud-generator |
| Formularios | skill: form-architecture |
| Calendario | skill: calendar-module |
| Mocks | skill: mock-service |
| Storybook | skill: storybook-documentation |

## Anti-patrones

- ❌ Una skill tomando decisiones arquitectónicas
- ❌ Un agente ejecutando trabajo repetitivo que debería ser skill
- ❌ Skills generando código fuera de su dominio definido
- ❌ Dos skills generando el mismo componente
- ❌ Código generado sin revisión de QA
