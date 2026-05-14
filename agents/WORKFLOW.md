# Workflow entre Agentes y Skills

## Fase 1: Análisis y Setup
```
Architecture Guardian:
  → feature-cleanup: "Revisa estructura actual"
  → responsive-audit: "Audita responsive"

QA & Refactor:
  → shadcn-standardization: "Normaliza UI existente"
```

## Fase 2: Implementación Guiada
```
Architecture Guardian:
  → Decide qué modulo implementar
  → entity-module: "Genera módulo entidad X"
  → crud-generator: "Genera CRUD para X"
  → role-page-scaffold: "Genera página base"

Security & Permissions:
  → permission-matrix: "Genera matriz de permisos"
```

## Fase 3: Backend
```
Backend Preparation:
  → api-contract: "Define contratos"
  → service-layer: "Genera capa de servicios"
  → entity-module: "Genera módulos backend"

Database & Concurrency:
  → Revisa y optimiza esquemas
```

## Fase 4: Calidad
```
QA & Refactor:
  → feature-cleanup: "Revisa código nuevo"
  → responsive-audit: "Revisa responsive"
  → shadcn-standardization: "Normaliza"

Architecture Guardian:
  → Aprueba o rechaza cambios
```

## Fase 5: Documentación
```
→ storybook-documentation: "Documenta componentes"
```

## Secuencia Recomendada

```
1. Plan (Architecture Guardian)
2. Scaffold (skills de generación)
3. Implement (skills de dominio)
4. Review (QA & Refactor)
5. Document (storybook-documentation)
6. Approve (Architecture Guardian)
```
