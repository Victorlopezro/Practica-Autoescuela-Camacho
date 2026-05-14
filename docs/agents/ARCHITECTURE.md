# Arquitectura del Sistema de Agentes

## Diagrama de Coordinación

```
                    ┌──────────────────────┐
                    │    Usuario / Cliente  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  gentle-orchestrator  │
                    │   (Coordinador SDD)   │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
   │  Arquitectura│    │  SDD Workflow │    │  Dominios    │
   │  Transversal  │    │  (fases)     │    │  Funcionales │
   ├─────────────┤    ├──────────────┤    ├──────────────┤
   │Arch Guardian │    │ sdd-explore  │    │ Student      │
   │QA & Refactor  │    │ sdd-propose  │    │ Teacher      │
   │Security       │    │ sdd-spec     │    │ Admin        │
   │DevOps         │    │ sdd-design   │    │              │
   │Stitch Analysis│    │ sdd-tasks    │    │              │
   │Mock & Contract│    │ sdd-apply    │    │              │
   │Frontend System│    │ sdd-verify   │    │              │
   │               │    │ sdd-archive  │    │              │
   └─────────────┘    └──────────────┘    └──────────────┘

   ┌──────────────┐    ┌──────────────┐
   │  Preparación  │    │  Backend      │
   ├──────────────┤    ├──────────────┤
   │Backend Prep   │    │ Database     │
   │AI Automation  │    │ Concurrency  │
   │WhatsApp       │    │              │
   └──────────────┘    └──────────────┘
```

## Capas del Sistema

### Capa 1: Coordinación (SDD Orchestrator)
Un solo agente orquesta todo el flujo de trabajo.
Delega a subagentes especializados.

### Capa 2: Transversal (Siempre activos)
Agentes que revisan todo el proyecto constantemente:
- Architecture Guardian
- QA & Refactor
- Security & Permissions

### Capa 3: SDD Workflow (Fases)
Agentes de proceso que ejecutan las fases SDD:
- explore → propose → spec → design → tasks → apply → verify → archive

### Capa 4: Dominios Funcionales
Agentes dueños de cada dominio de la aplicación:
- Student, Teacher, Admin

### Capa 5: Preparación Técnica
Agentes que preparan tecnología futura:
- Backend, Database, AI, WhatsApp, DevOps

## Flujo de Coordinación Típico

```
Usuario: "Necesito mejorar el dashboard del alumno"

Orchestrator:
  1. → stitch-analysis: "¿Qué pantallas tenemos del alumno?"
  2. → qa-refactor: "¿Qué deuda técnica hay en /student?"
  3. → architecture-guardian: "¿La estructura actual es correcta?"
  4. ← Síntesis para el usuario

  (SDD Workflow)
  5. → sdd-explore: "Explora dashboard del alumno"
  6. → sdd-propose: "Propón mejoras"
  7. → sdd-spec: "Especifica cambios"
  8. → sdd-design: "Diseña solución"
  9. → sdd-tasks: "Divide en tareas"

  (Ejecución)
  10. → student-domain: "Implementa tarea 1"
  11. → mock-contract: "Actualiza mocks si es necesario"

  (Verificación)
  12. → qa-refactor: "Revisa calidad"
  13. → sdd-verify: "Verifica contra specs"
  14. → sdd-archive: "Archiva cambios"
```
