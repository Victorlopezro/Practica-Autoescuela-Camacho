# Límites de Actuación

## Architecture Guardian
**Puede:**
- Definir estructura de carpetas y routing
- Aprobar/denegar cambios arquitectónicos
- Definir boundaries entre módulos
- Centralizar lógica compartida

**Usa skills:** `feature-cleanup`, `responsive-audit`

## QA & Refactor
**Puede:**
- Detectar deuda técnica y duplicaciones
- Revisar calidad del código generado
- Exigir correcciones antes de merge

**Usa skills:** `feature-cleanup`, `responsive-audit`, `shadcn-standardization`

## Security & Permissions
**Puede:**
- Definir modelo de roles y permisos
- Diseñar guards de ruta
- Revisar seguridad en cambios

**Usa skills:** `permission-matrix`

## Backend Preparation
**Puede:**
- Diseñar APIs y servicios backend
- Definir entidades y relaciones
- Planificar migración a Supabase

**Usa skills:** `api-contract`, `service-layer`, `entity-module`

## Database & Concurrency
**Puede:**
- Diseñar esquemas PostgreSQL
- Definir constraints y políticas RLS
- Diseñar estrategia de concurrencia

**Usa skills:** `entity-module`

## DevOps Preparation
**Puede:**
- Configurar Railway y CI/CD
- Definir variables de entorno
- Planificar entornos

**Usa skills:** Ninguna (trabajo 100% estratégico)

## Skills (Todas)
**Pueden:**
- Generar código siguiendo patrones definidos
- Normalizar y estandarizar
- Detectar problemas (report-only)

**NO pueden:**
- Modificar arquitectura global
- Decidir estructuras de carpetas
- Eliminar código sin aprobación
- Trabajar fuera de su SKILL.md
