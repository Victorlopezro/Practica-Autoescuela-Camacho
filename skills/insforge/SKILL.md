---
name: insforge
description: "Trigger: insforge, insforge deploy, compute, deploy backend. Deploy and manage services on InsForge platform."
---

# InsForge Skill

Guía para interactuar con InsForge como plataforma de backend de este proyecto.

## Stack Actual

| Capa | Servicio | Estado |
|------|----------|--------|
| **Database** | Supabase PostgreSQL (via Prisma) | ✅ En uso |
| **Backend** | NestJS (Docker) → InsForge Compute | 🚀 Pendiente deploy |
| **Frontend** | Next.js 16 → InsForge Deployments (Vercel) | 📝 Pendiente |
| **Auth** | JWT custom (NestJS) | ✅ Funcional |

## Credenciales

- **API Base URL**: `https://r4mm8bn9.eu-central.insforge.app`
- **API Key**: `ik_5e85cc6934a88b49b4702d61e109cc23`
- **Trial Claim URL**: Pendiente de reclamar

## Flujo de Deploy (Backend → Compute)

El backend NestJS se deploya como contenedor Docker en InsForge Compute (Fly.io):

```bash
npx @insforge/cli compute deploy ./backend \
  --name autoescuela-api \
  --port 3000 \
  --memory 512 \
  --env-file backend/.env.production
```

**Prerequisitos**: `flyctl` instalado en PATH (`npm install -g @fly.io/flyctl`).

### Env vars necesarias en producción

| Variable | Fuente |
|----------|--------|
| `DATABASE_URL` | Supabase connection string |
| `JWT_ACCESS_SECRET` | Generado localmente |
| `JWT_REFRESH_SECRET` | Generado localmente |
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `7d` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL del frontend en InsForge |
| `PORT` | `3000` |

## Flujo de Deploy (Frontend → Deployments)

El frontend Next.js se deploya via InsForge Deployments (Vercel). Usar el MCP `create-deployment`.

## MCP Tools Disponibles

| Tool | Uso |
|------|-----|
| `fetch-docs("instructions")` | Setup inicial |
| `fetch-docs("deployment")` | Docs de deploy |
| `get-backend-metadata` | Ver metadatos del backend |
| `download-template` | Scaffold de templates |
| `run-raw-sql` | SQL directo |
| `get-table-schema` | Ver schema de tablas |
| `create-deployment` | Deploy de frontend |

## Reglas

- **Nunca** poner `API_KEY` en variables `NEXT_PUBLIC_*` o `VITE_*`
- El Dockerfile del backend ya incluye entrypoint con `prisma migrate deploy`
- `.env.production` debe estar en `.gitignore`
- Usar `--env-set` para rotar env vars individuales (no `--env` que reemplaza todas)
