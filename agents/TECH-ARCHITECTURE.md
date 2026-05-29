# Arquitectura del Ecosistema Técnico

## Separación Agentes vs Skills

```
ESTRATÉGICO (Agentes)                    TÁCTICO (Skills)
─────────────────────                    ─────────────────
Gobiernan                               Ejecutan
Revisan                                 Generan
Deciden                                 Normalizan
Protegen boundaries                     Automatizan patrones
Coordinan                               Siguen instrucciones
```

## Diagrama

```
                    ┌──────────────────────────┐
                    │   Architecture Guardian  │
                    │   (Autoridad máxima)      │
                    └──────────┬───────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌────────────┐     ┌──────────────┐     ┌──────────────┐
   │ QA &       │     │ Security &   │     │ Backend      │
   │ Refactor   │     │ Permissions  │     │ Preparation  │
   └──────┬─────┘     └──────┬───────┘     └──────┬───────┘
          │                  │                    │
          │    ┌─────────────┼────────────────────┘
          │    │             │
          ▼    ▼             ▼
   ┌───────────────────────────────────────────┐
   │              SKILLS (13)                  │
   │                                           │
   │  crud-generator      mock-service         │
   │  role-page-scaffold  api-contract         │
   │  shadcn-standardiz.  feature-cleanup      │
   │  form-architecture   responsive-audit     │
   │  calendar-module     permission-matrix    │
   │  storybook-doc       service-layer        │
   │  entity-module                            │
   └───────────────────────────────────────────┘
```

## Agentes + Skills que los apoyan

| Agente | Skills que usa |
|--------|----------------|
| Architecture Guardian | `feature-cleanup`, `responsive-audit` |
| QA & Refactor | `feature-cleanup`, `responsive-audit`, `shadcn-standardization` |
| Security & Permissions | `permission-matrix` |
| Backend Preparation | `api-contract`, `service-layer`, `entity-module` |
| Database & Concurrency | `entity-module` |
| DevOps Preparation | — |

## Flujo de Trabajo Típico

```
Usuario: "Necesito pantalla de gestión de alumnos"

Architecture Guardian:
  1. Revisa estructura actual
  2. Determina qué skills aplicar
  3. Delega:

  → entity-module: "Genera módulo student completo"
  → crud-generator: "Genera tabla CRUD para alumnos"
  → role-page-scaffold: "Genera página base admin/students"

QA & Refactor:
  4. Revisa código generado
  5. Ejecuta feature-cleanup
  6. Aprueba o solicita cambios
```
