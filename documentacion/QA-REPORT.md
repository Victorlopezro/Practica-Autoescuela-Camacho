# QA Report — Frontend

**Fecha**: 2026-05-14  
**Scope**: `/frontend/src/`  
**Tooling**: Next.js 16, React 19, TypeScript 5, Tailwind 4, shadcn, Storybook 10

---

## Resumen

| Categoría | ALTA | MEDIA | BAJA |
|-----------|------|-------|------|
| Código duplicado | 2 | 3 | 1 |
| Tipado | 0 | 1 | 2 |
| Dead code | 3 | 2 | 1 |
| Responsive | 1 | 2 | 2 |
| Naming | 0 | 2 | 1 |
| Patrones | 1 | 0 | 0 |
| Storybook | 1 | 1 | 1 |
| **Total** | **8** | **11** | **8** |

---

## 1. Código Duplicado

### ALTA

**Issue QA-D1**: Dashboard stat cards idénticos en 3 roles
- **Archivos**: `admin/dashboard/page.tsx:24-28`, `student/dashboard/page.tsx:22-27`, `teacher/dashboard/page.tsx:17-19`
- **Descripción**: Los 3 dashboards renderizan grids de tarjetas de estadísticas con el mismo patrón (`Card` > `p.text-2xl.font-bold` + `p.text-xs`). Son ~8-12 líneas duplicadas 3 veces. Cuando se quiera cambiar el diseño del stat card, hay que tocarlo en 3 archivos.
- **Sugerencia**: Extraer un componente <StatCard value label color /> compartido en `@/components/shared/StatCard.tsx`

**Issue QA-D2**: Listas de alumnos duplicadas (Admin vs Teacher)
- **Archivos**: `admin/students/page.tsx:19-37`, `teacher/students/page.tsx:16-30`
- **Descripción**: Ambas listan alumnos con avatar inicial + nombre + progreso + estado. El layout es casi idéntico, cambian los datos mostrados (email vs nextClass).
- **Sugerencia**: Extraer `<StudentListItem>` compartido con props para campos opcionales

### MEDIA

**Issue QA-D3**: Payments duplicados (Admin vs Student)
- **Archivos**: `admin/payments/page.tsx:15-38`, `student/payments/page.tsx:14-36`
- **Descripción**: Ambos tienen una tarjeta de "pendiente total" + historial de pagos con el mismo patrón de renderizado. Difiere el título y el cálculo pero la UI es gemela.
- **Sugerencia**: `<PaymentSummaryCard pendingAmount />` + `<PaymentHistory items />`

**Issue QA-D4**: Perfiles de usuario duplicados (Student vs Teacher)
- **Archivos**: `student/profile/page.tsx:9-30`, `teacher/profile/page.tsx:9-22`
- **Descripción**: Ambos perfiles usan el mismo layout: avatar circular con iniciales, nombre, email, card de info, botón cerrar sesión. Mucho markup repetido.
- **Sugerencia**: `<UserProfileCard user />` compartido

**Issue QA-D5**: Date-block repetido en bookings/history
- **Archivos**: `student/bookings/page.tsx:29-31`, `student/bookings/page.tsx:47-49`, `student/history/page.tsx:20-22`
- **Descripción**: El bloque visual `w-12 h-12 bg-[...] rounded-xl flex flex-col items-center justify-center` con día + mes aparece en 3 lugares con ligeras variaciones de color.
- **Sugerencia**: `<DateBadge date color />` componente

### BAJA

**Issue QA-D6**: Layouts de rol casi idénticos
- **Archivos**: `admin/layout.tsx`, `student/layout.tsx`, `teacher/layout.tsx`
- **Descripción**: Los 3 layouts son 14 líneas casi idénticas. Solo cambia `userName` y `role`. El `pb-20` para MobileNav está en todos.
- **Sugerencia**: Un solo `(dashboard)/layout.tsx` con `userName` y `role` obtenidos de un store/context

---

## 2. Tipado

### MEDIA

**Issue QA-T1**: Datos mock inline sin tipos
- **Archivos**: TODAS las páginas en `app/{admin,student,teacher}/*/page.tsx`
- **Descripción**: Cada página define arrays de objetos literales inline SIN tipado explícito (`const stats = [...]`, `const teachers = [...]`). TypeScript infiere tipos amplios, perdiendo la conexión con las interfaces en `@/types`. Si cambia la interfaz `Student`, los datos mock de `admin/students/page.tsx` no fallarán.
- **Sugerencia**: Tipar todos los mock inline con `as const satisfies SomeType[]` o, mejor, importar desde `@/services/mocks`

### BAJA

**Issue QA-T2**: NavbarProps re-declara el tipo UserRole
- **Archivo**: `components/layouts/Navbar.tsx:8`
- **Descripción**: `userRole?: 'student' | 'teacher' | 'admin'` es exactamente el tipo `UserRole` ya definido en `@/types/index.ts:1`.
- **Sugerencia**: Importar `UserRole` desde `@/types`

**Issue QA-T3**: `teacherService.ts` import no usado
- **Archivo**: `services/mocks/teacherService.ts:2`
- **Descripción**: Importa `mockVehicles` de `./index` pero nunca lo usa en el archivo.
- **Sugerencia**: Eliminar el import

---

## 3. Dead Code

### ALTA

**Issue QA-DC1**: `@/components/ui/button.tsx` — componente sin uso
- **Archivo**: `components/ui/button.tsx:1-58`
- **Descripción**: Componente shadcn Button con 9 variantes y 8 tamaños. CERO páginas lo importan. Todas usan `<button>` nativo con clases hardcodeadas.
- **Sugerencia**: Eliminar o migrar todas las páginas a usar `<Button>` de shadcn

**Issue QA-DC2**: Storybook default files (template boilerplate)
- **Archivos**: `stories/Button.tsx`, `stories/Header.tsx`, `stories/Page.tsx`, `stories/Button.stories.ts`, `stories/Header.stories.ts`, `stories/Page.stories.ts`, `stories/button.css`, `stories/header.css`, `stories/page.css`, `stories/Configure.mdx`, `stories/assets/`
- **Descripción**: Archivos generados por `npx storybook init`. NO tienen relación con los componentes reales del proyecto. Son ~200 líneas de código muerto. Un desarrollador nuevo podría confundirse pensando que esos son los componentes del proyecto.
- **Sugerencia**: Eliminar todo `stories/` y crear stories reales para `Card`, `Navbar`, `MobileNav`, `Button`

**Issue QA-DC3**: `lucide-react` instalado pero no importado
- **Archivo**: `package.json:17`
- **Descripción**: Dependencia `lucide-react` presente. Sin embargo, 0 imports en el código. En su lugar se usan emojis (MobileNav: `🏠📅🚗👤`) o texto plano.
- **Sugerencia**: Reemplazar emojis por iconos de lucide-react y eliminar emoji del código de producción, o eliminar la dependencia

### MEDIA

**Issue QA-DC4**: Directorios vacíos en `src/`
- **Archivos**: `components/features/`, `components/shared/`, `hooks/`, `stores/`
- **Descripción**: 4 directorios existen pero están completamente vacíos. Incrementa la carga cognitiva al explorar la estructura.
- **Sugerencia**: Eliminar directorios vacíos o poblarlos con componentes reales

**Issue QA-DC5**: `app/(auth)/` route group vacío
- **Archivo**: `app/(auth)/`
- **Descripción**: Route group de Next.js que no contiene ningún archivo. Las páginas de auth (login) están fuera del grupo.
- **Sugerencia**: Mover `app/login/` dentro de `app/(auth)/login/` o eliminar el grupo

### BAJA

**Issue QA-DC6**: `shadcn` CLI en runtime dependencies
- **Archivo**: `package.json:21`
- **Descripción**: `"shadcn": "^4.7.0"` está en `dependencies`, no en `devDependencies`. Es una CLI para añadir componentes, solo se necesita en desarrollo.
- **Sugerencia**: Mover a `devDependencies`

---

## 4. Responsive

### ALTA

**Issue QA-R1**: MobileNav visible en desktop
- **Archivo**: `components/layouts/MobileNav.tsx:32`
- **Descripción**: `fixed bottom-0 left-0 right-0` sin media query. La navegación inferior se ve SIEMPRE, incluso en desktop a 1920px. Ocupa espacio vertical permanente.
- **Sugerencia**: Agregar `md:hidden` para ocultar en desktop y crear un sidebar/header nav para desktop

### MEDIA

**Issue QA-R2**: Grid fijo de 3 columnas en pantallas estrechas
- **Archivos**: `student/dashboard/page.tsx:21`, `teacher/dashboard/page.tsx:16`, `admin/dashboard/page.tsx:23`
- **Descripción**: `grid grid-cols-3 gap-3` fuerza 3 columnas incluso en móvil 360px. Los stat cards se comprimen demasiado, el texto se superpone.
- **Sugerencia**: `grid-cols-2 md:grid-cols-3` o `grid-cols-1 sm:grid-cols-3`

**Issue QA-R3**: Sin sidebar ni navegación desktop
- **Descripción**: No existe ningún componente de navegación para desktop. Sin hamburger, sin sidebar, sin top tabs. La única navegación es el `MobileNav` inferior (visible siempre) y el `Navbar` superior que solo muestra el branding + nombre.
- **Sugerencia**: Implementar sidebar (shadcn Sidebar) para `md:` o `lg:` en adelante

### BAJA

**Issue QA-R4**: `w-12` fijo para tiempo puede truncar
- **Archivos**: `teacher/dashboard/page.tsx:26`, `student/calendar/page.tsx:44`
- **Descripción**: `w-12` (48px) para mostrar la hora. En pantallas pequeñas si la hora es "10:00" entra, pero es un ancho fijo que no escala.
- **Sugerencia**: Usar `min-w-fit` o `shrink-0` en lugar de `w-12`

**Issue QA-R5**: Sin responsive utilities en grids de tarjetas
- **Descripción**: Ninguna página usa prefijos `sm:`, `md:`, `lg:` para ajustar grillas. En `admin/analytics/page.tsx:16` y `student/progress/page.tsx:17` usan `grid-cols-2` sin breakpoints.
- **Sugerencia**: Agregar `sm:grid-cols-2 lg:grid-cols-4` según contexto

---

## 5. Naming

### MEDIA

**Issue QA-N1**: `button.tsx` inconsistente con PascalCase del resto
- **Archivo**: `components/ui/button.tsx`
- **Descripción**: Todos los componentes en `layouts/` y `stories/` usan PascalCase (`Card.tsx`, `Navbar.tsx`, `Button.tsx`). `button.tsx` usa lowercase. Puede confundir en imports (diferencia entre `./Button` y `./button`).
- **Sugerencia**: Renombrar a `Button.tsx`

**Issue QA-N2**: Componentes de layout mezclados con features
- **Descripción**: `components/layouts/` contiene `Card.tsx` que es un componente de UI atómico, no de layout. `Card` debería estar en `components/ui/` o `components/shared/`.
- **Sugerencia**: Mover `Card.tsx` a `components/ui/` o `components/shared/`

### BAJA

**Issue QA-N3**: `components/features/` y `components/shared/` vacíos pero existen
- **Descripción**: La intención de separar features vs shared es buena pero al estar vacíos, el estándar no está definido. Un developer nuevo no sabe dónde poner un componente nuevo.
- **Sugerencia**: Poblar `shared/` con `StatCard`, `DateBadge`, `UserAvatar` o eliminar los directorios

---

## 6. Patrones

### ALTA

**Issue QA-P1**: Datos mock inline en cada página en lugar de servicios
- **Archivos**: TODAS las páginas en `app/{admin,student,teacher}/*/page.tsx`
- **Descripción**: Cada página tiene sus propios arrays de datos mock hardcodeados. Los servicios en `@/services/mocks/` están bien estructurados con async/await y delays, pero NINGUNA página los usa. El código real no está conectado a la arquitectura de servicios. Cambiar de mock a datos reales implicará reescribir página por página.
- **Sugerencia**: Reemplazar datos inline por llamadas a `studentService`, `teacherService` desde las páginas. Usar `useEffect` + `useState` (o React Query / SWR) para integrar servicios

### BAJA

**Issue QA-P2**: Sin separación página-componente contenedor
- **Descripción**: Todas las páginas mezclan lógica de datos y presentación en el mismo archivo. No hay patrón container/presentational. Las páginas de 30-40 líneas lo tienen todo junto.
- **Sugerencia**: Para la fase actual no es crítico, pero a futuro considerar contenedores que llamen servicios y presenters puros

---

## 7. Storybook

### ALTA

**Issue QA-S1**: No hay stories para componentes reales del proyecto
- **Descripción**: Los únicos stories existentes son del template `Example/Button`, `Example/Header`, `Example/Page`. Componentes reales como `Card`, `Navbar`, `MobileNav`, `Button` (shadcn) NO tienen stories. No se puede hacer visual testing ni review aislada.
- **Sugerencia**: Crear stories para `Card`, `Navbar`, `MobileNav` como mínimo

### MEDIA

**Issue QA-S2**: `@storybook/addon-a11y` infrautilizado
- **Archivo**: `.storybook/main.ts:11`
- **Descripción**: El addon de accesibilidad está instalado pero no hay stories reales a las que aplicarle auditoría.
- **Sugerencia**: Una vez creados los stories reales, aprovechar a11y addon para detectar problemas de accesibilidad

### BAJA

**Issue QA-S3**: `@storybook/addon-mcp` presente sin contexto de uso
- **Archivo**: `.storybook/main.ts:12`
- **Descripción**: Addon MCP de Storybook está configurado pero no se usa en ningún flujo del proyecto ni hay documentación al respecto.
- **Sugerencia**: Documentar su propósito o eliminar si no se necesita

---

## Issues Transversales

**Hardcoded colors everywhere**: `#00628c`, `#4558ae`, `#dce9ff`, etc. aparecen en ~20 archivos. Las variables CSS están definidas en `globals.css` y `BRANDING.colors` en constantes, pero ninguna página las usa. Si cambia el primary color, hay que reemplazarlo en decenas de strings.

**Emojis en producción**: `MobileNav.tsx` y `admin/vehicles/page.tsx` usan emojis (`🏠📅🚗👤🚗`) como iconos en lugar de la librería `lucide-react` que ya está instalada. Los emojis tienen renderizado inconsistente entre navegadores y SO.

**Sin tests**: 0 archivos `*.test.*` o `*.spec.*` en todo `src/`. Vitest está configurado pero sin usar.

---

## Issues Prioritarios para Acción Inmediata

| Prioridad | Issue | ¿Por qué? |
|-----------|-------|-----------|
| 1 | QA-DC1 | Button shadcn sin usar + botones nativos inconsistentes en todas partes |
| 2 | QA-DC2 | Template boilerplate de Storybook confunde a developers nuevos |
| 3 | QA-R1 | MobileNav visible en desktop es error de UX |
| 4 | QA-P1 | Datos inline en cada página impide migrar a API real |
| 5 | QA-S1 | Sin stories para componentes reales = sin visual testing |
| 6 | QA-D1 | Stat cards duplicados = triple mantenimiento |
| 7 | QA-DC3 | lucide-react instalado pero emojis en producción |
