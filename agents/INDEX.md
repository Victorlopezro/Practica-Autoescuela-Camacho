# Índice de Agentes

## Agentes de Coordinación

| Agente | Archivo | Propósito |
|--------|---------|-----------|
| gentle-orchestrator | ~/.config/opencode/opencode.json | Coordina todo el equipo de agentes |

## Agentes de Arquitectura Transversal

| # | Agente | Archivo | Dominio |
|---|--------|---------|---------|
| 1 | Architecture Guardian | `agents/architecture-guardian/AGENT.md` | Arquitectura global |
| 2 | Frontend System | `agents/frontend-system/AGENT.md` | Design system y UI |
| 3 | Stitch Analysis | `agents/stitch-analysis/AGENT.md` | Análisis de legacy |
| 4 | Mock & Contract | `agents/mock-contract/AGENT.md` | Tipos y servicios mock |
| 5 | QA & Refactor | `agents/qa-refactor/AGENT.md` | Calidad y deuda técnica |
| 6 | Security & Permissions | `agents/security-permissions/AGENT.md` | Seguridad y RBAC |
| 7 | DevOps Preparation | `agents/devops-preparation/AGENT.md` | Despliegue e infra |

## Agentes de Dominio Funcional

| # | Agente | Archivo | Dominio |
|---|--------|---------|---------|
| 8 | Student Domain | `agents/student-domain/AGENT.md` | /student |
| 9 | Teacher Domain | `agents/teacher-domain/AGENT.md` | /teacher |
| 10 | Admin Domain | `agents/admin-domain/AGENT.md` | /admin |

## Agentes de Preparación Técnica

| # | Agente | Archivo | Dominio |
|---|--------|---------|---------|
| 11 | Backend Preparation | `agents/backend-preparation/AGENT.md` | Backend futuro |
| 12 | Database & Concurrency | `agents/database-concurrency/AGENT.md` | BD y concurrencia |
| 13 | AI Automation | `agents/ai-automation/AGENT.md` | Automatizaciones IA |
| 14 | WhatsApp Integration | `agents/whatsapp-integration/AGENT.md` | Notificaciones |

## Agentes SDD (Workflow)

| Agente | Archivo | Fase |
|--------|---------|------|
| sdd-explore | SDD skill incorporado | Investigación |
| sdd-propose | SDD skill incorporado | Propuesta |
| sdd-spec | SDD skill incorporado | Especificación |
| sdd-design | SDD skill incorporado | Diseño técnico |
| sdd-tasks | SDD skill incorporado | Descomposición |
| sdd-apply | SDD skill incorporado | Implementación |
| sdd-verify | SDD skill incorporado | Verificación |
| sdd-archive | SDD skill incorporado | Archivo |

## Archivos de Configuración Global

| Archivo | Propósito |
|---------|-----------|
| `agents/README.md` | Visión general del sistema |
| `agents/COLLABORATION.md` | Reglas de colaboración |
| `agents/BOUNDARIES.md` | Límites de actuación |
| `agents/WORKFLOW.md` | Flujo de trabajo |
| `agents/PRIORITIES.md` | Prioridades de actuación |
| `agents/TECH-ARCHITECTURE.md` | Arquitectura del ecosistema técnico (agentes vs skills) |
| `agents/AGENT-SYSTEM-ARCHITECTURE.md` | Arquitectura del sistema de agentes y coordinación |
| `agents/INDEX.md` | Este índice |

## Convenciones

- 🟢 **Disponible**: El agente está configurado y listo para usar
- 🟡 **En preparación**: El agente está definido pero no configurado
- 🔴 **No disponible**: El agente no está implementado
- 📁 **Carpeta**: `agents/{nombre}/AGENT.md`
- ⚙️ **Config**: `~/.config/opencode/opencode.json`
