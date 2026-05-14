# Sistema Técnico — Autoescuela Camacho

## Visión General

Ecosistema de **6 agentes** (gobierno/coordinación) + **13 skills** (ejecución/automatización).

## Principios Rectores

1. **Agentes gobiernan** — deciden, revisan, protegen arquitectura
2. **Skills ejecutan** — generan, normalizan, automatizan patrones
3. Ningún cambio importante sin justificación + documentación
4. No duplicar componentes existentes
5. No romper responsive, branding o UX principal
6. TypeScript estricto, modular, mantenible
7. Toda lógica compartida se centraliza
8. Toda integración futura se prepara desacoplada

## Agentes (6)

| # | Agente | Responsabilidad |
|---|--------|-----------------|
| 1 | **Architecture Guardian** | Arquitectura global, boundaries, modularidad |
| 2 | **QA & Refactor** | Calidad, deuda técnica, detección de problemas |
| 3 | **Security & Permissions** | Seguridad, RBAC, control de acceso |
| 4 | **Backend Preparation** | Arquitectura backend, APIs, Supabase |
| 5 | **Database & Concurrency** | Esquemas BD, concurrencia, transacciones |
| 6 | **DevOps Preparation** | Infraestructura, CI/CD, Railway |

## Skills (13)

| # | Skill | Propósito |
|---|-------|-----------|
| 1 | `crud-generator` | Tablas, formularios, CRUDs completos |
| 2 | `role-page-scaffold` | Páginas base por rol |
| 3 | `shadcn-standardization` | Normalización de UI |
| 4 | `form-architecture` | Formularios con zod + react-hook-form |
| 5 | `calendar-module` | Calendario, slots, disponibilidad |
| 6 | `mock-service` | Mocks, servicios fake |
| 7 | `api-contract` | DTOs, contratos API |
| 8 | `feature-cleanup` | Detección de duplicados deuda |
| 9 | `responsive-audit` | Auditoría responsive |
| 10 | `permission-matrix` | Matrices RBAC |
| 11 | `storybook-documentation` | Stories y documentación |
| 12 | `service-layer` | Servicios desacoplados |
| 13 | `entity-module` | Módulos de entidad completos |

## Workflow Agente → Skill

```
Agente detecta necesidad
  → Selecciona skill aplicable
    → Lee SKILL.md de la skill
      → Ejecuta el patrón
        → Agente revisa resultado
          → QA agente valida calidad
```

## Historia

- **v1.0**: 14 agentes (todos subagentes) — sobreingeniería
- **v2.0**: 6 agentes + 13 skills — separación clara gobierno/ejecución
