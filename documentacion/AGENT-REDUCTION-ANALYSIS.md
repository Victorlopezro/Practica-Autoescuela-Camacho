# Análisis de Agentes — Redundancias y Reestructuración

## Metodología
Cada agente se evalúa contra: ¿Gobierna/decide o ejecuta/repite?
- **Gobernar/Decidir** → AGENTE (estratégico, revisa, coordina)
- **Ejecutar/Repetir** → SKILL (automático, genera, normaliza)

---

## Evaluación de los 14 Agentes Originales

### 1. Architecture Guardian ✅ MANTENER
- **Eval**: Gobernanza estratégica pura
- **Por qué**: Define boundaries, protege arquitectura, decide estructura
- **Acción**: Mantener como agente principal

### 2. Frontend System ❌ ELIMINAR → SKILL
- **Eval**: 100% ejecución repetitiva
- **Por qué**: Normalizar UI, configurar Tailwind, crear stories — patrones, no decisiones
- **Skill destino**: `shadcn-standardization`, `storybook-documentation`

### 3. Stitch Analysis ❌ ELIMINAR → SKILL
- **Eval**: Tarea única de análisis, no necesita gobernanza continua
- **Por qué**: El análisis de legacy se hace una vez; detectar duplicados es trabajo de skill
- **Skill destino**: `feature-cleanup`

### 4. Student Domain ❌ ELIMINAR → SKILLS
- **Eval**: Ejecución pura de dominio
- **Por qué**: Crear páginas, conectar mocks, CRUDs — patrones repetitivos
- **Skills destino**: `crud-generator`, `role-page-scaffold`, `calendar-module`, `entity-module`

### 5. Teacher Domain ❌ ELIMINAR → SKILLS
- **Eval**: Idéntico a Student Domain
- **Por qué**: Mismas razones
- **Skills destino**: Las mismas

### 6. Admin Domain ❌ ELIMINAR → SKILLS
- **Eval**: Idéntico a Student/Teacher Domain
- **Por qué**: CRUDs, tablas, formularios — patrones
- **Skills destino**: Las mismas

### 7. Mock & Contract ❌ ELIMINAR → SKILLS
- **Eval**: Generación de código basada en tipos
- **Por qué**: Mocks, servicios, contratos — todo es patrón repetitivo
- **Skills destino**: `mock-service`, `api-contract`, `service-layer`

### 8. Backend Preparation ✅ MANTENER (simplificado)
- **Eval**: Diseño estratégico, decisiones arquitectónicas
- **Por qué**: Diseñar APIs, entidades, relaciones — requiere visión
- **Acción**: Mantener como agente, absorber AI + WhatsApp como módulos

### 9. Database & Concurrency ✅ MANTENER (simplificado)
- **Eval**: Diseño estratégico de base de datos
- **Por qué**: Esquemas, constraints, concurrencia — decisiones de diseño
- **Acción**: Mantener como agente

### 10. AI Automation ❌ FUSIONAR
- **Eval**: Cobertura solapada con Backend Preparation
- **Por qué**: Las automatizaciones son parte del backend
- **Acción**: Fusionar en backend-preparation como submódulo

### 11. WhatsApp Integration ❌ FUSIONAR
- **Eval**: Misma situación que AI Automation
- **Por qué**: Es una integración backend más
- **Acción**: Fusionar en backend-preparation como submódulo

### 12. QA & Refactor ✅ MANTENER
- **Eval**: Gobernanza de calidad
- **Por qué**: Detectar deuda técnica requiere criterio y visión global
- **Acción**: Mantener como agente, usar skills para correcciones automáticas

### 13. Security & Permissions ✅ MANTENER (simplificado)
- **Eval**: Decisiones estratégicas de seguridad
- **Por qué**: Diseñar RBAC, definir políticas — requiere visión
- **Skill apoyo**: `permission-matrix`

### 14. DevOps Preparation ✅ MANTENER (simplificado)
- **Eval**: Decisiones de infraestructura
- **Por qué**: CI/CD, entornos, Railway — estratégico
- **Acción**: Mantener como agente

---

## Resumen

| Estado | Cantidad | Agentes |
|--------|----------|---------|
| ✅ MANTENER | 6 | architecture-guardian, qa-refactor, security-permissions, backend-preparation, database-concurrency, devops-preparation |
| ❌ ELIMINAR → SKILL | 6 | frontend-system, stitch-analysis, student-domain, teacher-domain, admin-domain, mock-contract |
| 🔀 FUSIONAR | 2 | ai-automation → backend-prep, whatsapp → backend-prep |

## Nueva Estructura

```
AGENTES (6) — Gobiernan, deciden, revisan
├── architecture-guardian     → Arquitectura global
├── qa-refactor               → Calidad y deuda técnica
├── security-permissions      → Seguridad y RBAC
├── backend-preparation       → Backend + AI + WhatsApp
├── database-concurrency      → BD y concurrencia
└── devops-preparation        → Infraestructura

SKILLS (13) — Ejecutan, generan, normalizan
├── crud-generator            → Tablas, formularios, CRUDs
├── role-page-scaffold        → Páginas base por rol
├── shadcn-standardization    → Normalización UI
├── form-architecture         → Formularios con zod
├── calendar-module           → Calendario y slots
├── mock-service              → Mocks y datos fake
├── api-contract              → DTOs y contratos
├── feature-cleanup           → Detección de duplicados
├── responsive-audit          → Auditoría responsive
├── permission-matrix         → Matrices RBAC
├── storybook-documentation   → Stories y documentación
├── service-layer             → Servicios desacoplados
└── entity-module             → Entidades completas
```
