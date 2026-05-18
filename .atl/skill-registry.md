# Skill Registry — practica-autoescuela-camacho

Generated: 2026-05-15

## Project Skills (13)

| Name | Trigger | Path | Rules |
|------|---------|------|-------|
| api-contract | defining API contracts, creating types, designing request/response models | `skills/api-contract/SKILL.md` | DTOs with `_at` timestamps (ISO 8601); `snake_case` for DB, `camelCase` for TS; prefix DTO for transfer objects; paginated list responses with total/page; never `any` |
| calendar-module | creating calendar views, booking systems, schedule management, availability pickers | `skills/calendar-module/SKILL.md` | Core system — handle with care; 5 components: WeekCalendar, DayCalendar, MonthCalendar, TimeSlotPicker, AvailabilityEditor; 5 slot states: available/booked/pending/blocked/past with specific colors; mobile-only DayCalendar, tablet WeekCalendar |
| crud-generator | creating CRUD interfaces, tables, admin panels, data management forms | `skills/crud-generator/SKILL.md` | Type first → service → UI; empty/error states mandatory; actions order: edit, delete, create; always shadcn/ui components: Table, Dialog, Form, Button; never `any` |
| entity-module | creating new entities, domain modules, feature modules | `skills/entity-module/SKILL.md` | 8 supported entities with specific roles (student, teacher, vehicle, booking, availability, payment, incident, schedule); generates: types, DTOs, service interface, mock, table, form, dialog; zod validation schemas; full file structure per entity |
| feature-cleanup | code review, technical debt analysis, pre-refactor cleanup | `skills/feature-cleanup/SKILL.md` | REPORT only — never auto-modify; detect: duplicate components, dead imports, repeated Tailwind, redundant variants, TODO/console.log; severity: ALTA/MEDIA/BAJA; prioritize ALTA and MEDIA |
| form-architecture | creating forms, data entry interfaces, settings pages, registration flows | `skills/form-architecture/SKILL.md` | react-hook-form + zodSchema + shadcn FormField; mandatory states: loading (disable submit), error (per-field + toast), success (reset/redirect); never raw `<input>` |
| mock-service | creating mock data, service mocks, fake APIs, testing data | `skills/mock-service/SKILL.md` | Standard CRUD mock pattern with delay(); min 3 items per entity; edge cases included; relative dates; follows entity type contracts |
| permission-matrix | implementing auth, role-based access, permission checks, route guards | `skills/permission-matrix/SKILL.md` | 3 roles: admin/teacher/student; `resource:action` permission strings; typed Permission union; hardcoded ROLE_PERMISSIONS map; Component-level guards with `can()` helper |
| responsive-audit | responsive review, mobile testing, cross-device compatibility check | `skills/responsive-audit/SKILL.md` | Mobile-first (375px) priority; touch targets ≥44×44px; min 16px inputs to prevent iOS zoom; no overflow:hidden on containers; no fixed widths; table horizontal scroll on mobile |
| role-page-scaffold | creating new pages for student, teacher, or admin roles | `skills/role-page-scaffold/SKILL.md` | Always `'use client'`; existing layouts — never create new ones; existing Navbar/MobileNav — never duplicate; base padding `p-4` + `space-y-4`; titles `text-xl font-bold text-gray-900` |
| service-layer | creating service layer, API integration, data access layer, backend communication | `skills/service-layer/SKILL.md` | Interface-first architecture: UI → Services (interfaces) → Adapters (mock|api|supabase); React Context provider pattern for DI; never call adapters directly from components |
| shadcn-standardization | UI normalization, design system maintenance, visual consistency review | `skills/shadcn-standardization/SKILL.md` | Never hardcode hex colors — use semantic classes; always use shadcn components (Button, Card, Input, Dialog, Table, Badge); spacing: p-4 pages, space-y-4 sections, gap-3 elements; responsive: sm/md/lg breakpoints only |
| storybook-documentation | creating Storybook stories, documenting components, UI library maintenance | `skills/storybook-documentation/SKILL.md` | `'use client'` stories with Meta/StoryObj pattern; autodocs tags; required variants: Default, WithData, Empty, Loading; args for all props |

## User Skills (9)

| Name | Trigger | Path | Rules |
|------|---------|------|-------|
| branch-pr | creating, opening, or preparing PRs for review | `~/.config/opencode/skills/branch-pr/SKILL.md` | Every PR MUST link an approved issue; every PR MUST have exactly one `type:*` label; automated checks must pass; blank PRs without issue linkage blocked |
| chained-pr | PRs over 400 lines, stacked PRs, review slices | `~/.config/opencode/skills/chained-pr/SKILL.md` | Split PRs >400 lines unless explicit exception; keep each PR ≤60min review; tests/docs with verified unit; dependency diagram in every child PR; no mixing chain strategies |
| cognitive-doc-design | writing guides, READMEs, RFCs, onboarding, architecture docs | `~/.config/opencode/skills/cognitive-doc-design/SKILL.md` | Lead with answer; progressive disclosure; chunk related info; signpost with headings/tables; recognition over recall; review empathy |
| comment-writer | PR feedback, issue replies, reviews, Slack messages, GitHub comments | `~/.config/opencode/skills/comment-writer/SKILL.md` | Be useful fast — start with action; warm and direct, not corporate; 1-3 paragraphs max; explain why; avoid pile-ons; match thread language; Rioplatense voseo in Spanish |
| go-testing | Go tests, go test coverage, Bubbletea teatest, golden files | `~/.config/opencode/skills/go-testing/SKILL.md` | NOT APPLICABLE — no Go in this project |
| issue-creation | creating GitHub issues, bug reports, feature requests | `~/.config/opencode/skills/issue-creation/SKILL.md` | Blank issues disabled — MUST use template; every issue gets `status:needs-review`; maintainer MUST add `status:approved` before PR; questions go to Discussions |
| judgment-day | dual review, adversarial review, juzgar | `~/.config/opencode/skills/judgment-day/SKILL.md` | Two blind judges in parallel; classify warnings as real vs theoretical; fix confirmed issues then re-judge; terminal states: APPROVED or ESCALATED; max 2 fix iterations |
| skill-creator | new skills, agent instructions, AI usage patterns | `~/.config/opencode/skills/skill-creator/SKILL.md` | Skill = LLM runtime instruction contract, not human docs; target 180-450 body tokens; frontmatter required; references must be local; description ≤250 chars, trigger-first |
| work-unit-commits | implementation, commit splitting, chained PRs | `~/.config/opencode/skills/work-unit-commits/SKILL.md` | Commit by work unit, not file type; keep tests with code; keep docs with user-visible change; tell a story with commit sequence; never --no-verify unless user insists |

## Agent Files Referenced

- `agents/ARCHITECTURE.md` — agent vs skill separation with diagram
- `agents/WORKFLOW.md` — 5-phase sequence (plan, scaffold, implement, review, document)
- `agents/COLLABORATION.md` — agent decides, skill executes; QA validates before merge
- `agents/BOUNDARIES.md` — agent-specific scopes and prohibitions
- `agents/README.md` — index: 6 agents + 13 skills, principles, v1→v2 history
- `agents/PRIORITIES.md` — 5-phase upgrade roadmap (normalization → consolidation → services → backend → integrations)
- `frontend/AGENTS.md` — Next.js 16 breaking changes warning; read `node_modules/next/dist/docs/`
