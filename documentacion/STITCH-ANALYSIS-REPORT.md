# ANALISIS PROFUNDO DE PANTALLAS STITCH - REPORTE COMPLETO

> Generado: 2026-05-14
> Total carpetas analizadas: 62 (57 con code.html + 5 sin HTML)

---

## 1. RESUMEN EJECUTIVO

| Metric | Valor |
|--------|-------|
| Total carpetas en /legacy/stitch-imports/ | 62 |
| Pantallas con code.html (analizables) | 57 |
| Carpetas sin code.html (solo imagen/diseno) | 5 |
| Funcionalidades UNICAS detectadas | ~22 |
| Pantallas DUPLICADAS | ~26 |
| Variantes (mobile/refinado) | ~4 |
| Sin codigo (obsoletas/referencias) | 5 |
| **Tasa de redundancia** | **~56%** |

### Paleta comun (design system implicito)

TODAS las pantallas comparten EXACTAMENTE la misma paleta Material 3:
- Primary: #00628c / Primary Container: #007cb0
- Secondary: #4558ae / Secondary Container: #90a3ff
- Surface: #f8f9ff / Surface Container: #e5eeff
- Error: #ba1a1a / Error Container: #ffdad6
- Font: Inter en todos los pesos
- Misma configuracion de border-radius, spacing y tipografia

Esto indica que NO hay divergencia de diseno -- solo ITERACIONES de la misma base.

---

## 2. CARPETAS SIN CODE.HTML (OBSOLETAS / REFERENCIAS VISUALES)

| Carpeta | Contenido | Clasificacion |
|---------|-----------|---------------|
| logo_camacho.png/ | Solo screen.png | OBSOLETA - logo aislado |
| screencapture_...aula_virtual...png/ | Solo screen.png | OBSOLETA - screenshot directo del sitio |
| screencapture_...conocenos...png/ | Solo screen.png | OBSOLETA - screenshot directo del sitio |
| screencapture_...cursos...png/ | Solo screen.png | OBSOLETA - screenshot directo del sitio |
| vial_moderno/ | DESIGN.md (especificacion de diseno) | OBSOLETA - design token spec, no es pantalla |

---

## 3. LISTA COMPLETA CLASIFICADA

### 3.1 LANDING Y AUTENTICACION

**inicio_de_sesi_n/**
- Rol: auth | Tipo: login | Tamano: 199 lineas
- Componentes: form login (email+password), icon inputs, login button, forgot password, info cards
- Mobile-first: SI
- Clasificacion: UNICA

**landing_page_autoescuela_camacho_1/**
- Rol: landing | Tipo: landing page | Tamano: 467 lineas
- Componentes: nav sticky, hero, secciones, CTA, glass cards
- Mobile-first: SI
- Clasificacion: UNICA

**landing_page_autoescuela_camacho_2/**
- Rol: landing | Tipo: landing page | Tamano: 466 lineas
- Componentes: identico a _1 con variacion minima
- Clasificacion: VARIANTE

### 3.2 ALUMNO - DASHBOARD

**panel_del_alumno_refinado/** [CANONICA]
- Rol: student | Tipo: dashboard | Tamano: 437 lineas
- Componentes: sidebar, topbar, stat KPI cards, glass cards, skeleton loaders, progress indicators, calendar mini, notificaciones
- Mobile-first: PARCIAL
- Clasificacion: UNICA
- Notas: Version mas completa. Tiene .skeleton para loading states.

**panel_de_control_alumno_refactorizado/** -> Tamano: 291 | DUPLICADO
**panel_de_control_alumno_refactored/** -> Tamano: 432 | DUPLICADO
**student_dashboard_1/** -> Tamano: 414 | DUPLICADO
**student_dashboard_2/** -> Tamano: 414 | DUPLICADO

### 3.3 ALUMNO - PROGRESO TEORICO

**theory_progress_1/** [CANONICA]
- Rol: student | Tipo: progress theoretical | Tamano: 256 lineas
- Componentes: progress bars, topic cards, percentage indicators, stat counters
- Mobile-first: SI
- Clasificacion: UNICA

**theory_progress_2/** -> Tamano: 257 | DUPLICADO
**progreso_te_rico_es/** -> Tamano: 237 | DUPLICADO (traduccion ES)

### 3.4 ALUMNO - PROGRESO PRACTICO

**practical_skills_progress_1/** [CANONICA]
- Rol: student | Tipo: progress practical | Tamano: 345 lineas
- Componentes: skill cards, progress bars, category list, stat indicators
- Mobile-first: SI
- Clasificacion: UNICA

**practical_skills_progress_2/** -> Tamano: 339 | DUPLICADO
**practical_progress/** -> Tamano: 287 | DUPLICADO

### 3.5 ALUMNO - RESERVA DE CLASES

**lesson_booking_system_1/** [CANONICA]
- Rol: student | Tipo: booking/calendar | Tamano: 302 lineas
- Componentes: calendar grid, time slots, date picker, instructor selector, glass cards
- Mobile-first: SI
- Clasificacion: UNICA

**lesson_booking_system_2/** -> Tamano: 303 | DUPLICADO
**reserva_de_clases_es/** -> Tamano: 294 | DUPLICADO (traduccion ES)

### 3.6 ALUMNO - PERFIL

**perfil_de_alumno_es/** [CANONICA]
- Rol: student | Tipo: profile | Tamano: 315 lineas
- Componentes: avatar, form fields, settings sections, tabs
- Mobile-first: SI
- Clasificacion: UNICA

**student_profile_settings_1/** -> Tamano: 322 | DUPLICADO
**student_profile_settings_2/** -> Tamano: 321 | DUPLICADO
**profile_settings/** -> Tamano: 293 | DUPLICADO

### 3.7 ALUMNO - PAGOS Y FACTURAS

**billing_payments/** [CANONICA]
- Rol: student | Tipo: billing | Tamano: 283 lineas
- Componentes: invoice table, payment methods, stat cards, amount summary
- Mobile-first: SI
- Clasificacion: UNICA

**pagos_y_facturas_es/** -> Tamano: 334 | DUPLICADO
**payments_invoices_1/** -> Tamano: 337 | DUPLICADO
**payments_invoices_2/** -> Tamano: 332 | DUPLICADO

### 3.8 ALUMNO - AI ANALYTICS

**ai_exam_analytics_1/** [CANONICA]
- Rol: student | Tipo: analytics | Tamano: 327 lineas
- Componentes: progress ring circles (SVG), AI insight cards, chart bars, stat cards, glass cards
- Mobile-first: SI
- Clasificacion: UNICA

**ai_exam_analytics_2/** -> Tamano: 326 | DUPLICADO
**anal_tica_ia_es/** -> Tamano: 313 | DUPLICADO (traduccion ES)
**ai_insights/** -> Tamano: 257 | DUPLICADO

### 3.9 PROFESOR - PANEL PRINCIPAL

**panel_del_profesor_inicio/** [CANONICA]
- Rol: teacher | Tipo: dashboard | Tamano: 390 lineas
- Componentes: sidebar oscuro, topbar glassmorphic, KPI cards, greeting hero, notificaciones, seccion IA Predictiva
- Mobile-first: PARCIAL - sidebar oculto, topbar adaptativo
- Clasificacion: UNICA

**panel_del_profesor_refactored/** -> Tamano: 389 | DUPLICADO
**panel_del_profesor_refactorizado/** -> Tamano: 273 | DUPLICADO

### 3.10 PROFESOR - AGENDA

**agenda_diaria/** [CANONICA]
- Rol: teacher | Tipo: agenda/calendar | Tamano: 406 lineas
- Componentes: weekly calendar, time grid, class cards, student names, status badges
- Mobile-first: PARCIAL
- Clasificacion: UNICA

**agenda_del_profesor_refinado/** -> Tamano: 419 | DUPLICADO

### 3.11 ADMIN - PANEL EJECUTIVO

**panel_ejecutivo/** [CANONICA]
- Rol: admin | Tipo: executive dashboard | Tamano: 426 lineas
- Componentes: sidebar claro, topbar con search, KPI cards (ingresos, alumnos, clases), grafica barras, tabla actividad, avatar admin
- Mobile-first: PARCIAL - sidebar fijo 280px, layout responsive
- Clasificacion: UNICA

**panel_ejecutivo_refinado/** -> Tamano: 457 | DUPLICADO
**panel_ejecutivo_refactored/** -> Tamano: 469 | DUPLICADO
**panel_ejecutivo_refactorizado/** -> Tamano: 257 | DUPLICADO
**panel_ejecutivo_mobile_fixed/** -> Tamano: 461 | VARIANTE MOBILE

### 3.12 ADMIN - GESTION DE ALUMNOS

**gesti_n_de_alumnos/** [CANONICA]
- Rol: admin | Tipo: CRUD table | Tamano: 490 lineas
- Componentes: data table, search bar, filters, student cards, action buttons, pagination
- Mobile-first: NO - diseno de tabla clasica
- Clasificacion: UNICA

**gesti_n_de_alumnos_admin/** -> Tamano: 535 | DUPLICADO
**gesti_n_de_alumnos_admin_refactored/** -> Tamano: 456 | DUPLICADO
**gesti_n_de_alumnos_admin_refactorizado/** -> Tamano: 280 | DUPLICADO

### 3.13 ADMIN - GESTION DE FLOTA

**gesti_n_de_veh_culos/** [CANONICA]
- Rol: admin | Tipo: fleet management | Tamano: 407 lineas
- Componentes: vehicle cards, status badges, maintenance indicators, stat cards
- Mobile-first: PARCIAL
- Clasificacion: UNICA

**gesti_n_de_flota_admin/** -> Tamano: 422 | DUPLICADO
**gesti_n_de_flota_refinado/** -> Tamano: 463 | DUPLICADO
**gesti_n_de_flota_mobile_fixed/** -> Tamano: 481 | VARIANTE MOBILE

### 3.14 ADMIN - OTROS (UNICOS - SIN DUPLICADOS)

**gesti_n_de_profesores_admin/**
- Rol: admin | Tipo: CRUD table | Tamano: 507 lineas
- Componentes: sidebar, topbar, data table, search, teacher cards, badges
- Clasificacion: UNICA

**centro_de_horarios_admin/**
- Rol: admin | Tipo: schedule center | Tamano: 409 lineas
- Componentes: calendar grid, time slots, class assignments, teacher select
- Clasificacion: UNICA

**panel_financiero_admin/**
- Rol: admin | Tipo: financial panel | Tamano: 495 lineas
- Componentes: stat cards, revenue chart, transaction table, expense categories, date range
- Clasificacion: UNICA

**configuraci_n_del_sistema_admin/**
- Rol: admin | Tipo: system configuration | Tamano: 350 lineas
- Componentes: form sections, toggle switches, input groups, save button
- Clasificacion: UNICA

**roles_y_permisos/**
- Rol: admin | Tipo: roles & permissions | Tamano: 395 lineas
- Componentes: role cards, permission matrix, toggle switches, user list
- Clasificacion: UNICA

**incidencias_y_comunicaciones/**
- Rol: admin | Tipo: incidents & communications | Tamano: 385 lineas
- Componentes: ticket list, status badges, priority indicators, message thread
- Clasificacion: UNICA

**ia_y_anal_tica_admin/**
- Rol: admin | Tipo: AI analytics admin | Tamano: 410 lineas
- Componentes: stat cards, AI insight panels, charts, prediction indicators
- Clasificacion: UNICA

**evaluaci_n_de_alumno/**
- Rol: admin/teacher | Tipo: student evaluation | Tamano: 434 lineas
- Componentes: evaluation form, rubric, score inputs, comments section, rating scale
- Clasificacion: UNICA

**estad_sticas_de_rendimiento/**
- Rol: admin | Tipo: performance statistics | Tamano: 439 lineas
- Componentes: charts, stat cards, trend lines, filters, date range
- Clasificacion: UNICA

### 3.15 LAYOUT GLOBAL

**global_saas_layout/**
- Rol: all roles | Tipo: layout shell | Tamano: 341 lineas
- Componentes: sidebar oscuro, topbar glassmorphic, search bar, avatar, notificaciones, bottom nav mobile
- Mobile-first: SI - viewport-fit=cover, sidebar hidden on mobile, bottom nav
- Clasificacion: UNICA (layout estructural)
- Notas: Es el SHELL de layout. Contiene sidebar + topbar + content area.

---

## 4. COMPONENTES UI REUTILIZABLES IDENTIFICADOS

### 4.1 ESTRUCTURALES / LAYOUT

| Componente | Screens donde aparece | Variantes |
|-----------|----------------------|-----------|
| **Sidebar** | panel_ejecutivo, gestion_alumnos_admin, panel_profesor, global_saas_layout | (a) Light (fondo blanco) - admin; (b) Dark (navy) - student/teacher |
| **TopAppBar** | TODOS los dashboards | Glassmorphic (backdrop-blur), con/sin search |
| **Bottom Navigation** | mobile_fixed, global_saas_layout | Para mobile |
| **Main Content Shell** | global_saas_layout | Layout wrappers con ml-[280px] |

### 4.2 CARDS

| Componente | Screens | Uso |
|-----------|---------|-----|
| **Stat Card (KPI)** | panel_ejecutivo, panel_alumno, panel_profesor, panel_financiero | icono + label + valor + trend |
| **Glass Card** | panel_alumno_refinado, ai_exam_analytics, billing_payments, landing | .glass-card con backdrop blur |
| **Vehicle Card** | gestion_vehiculos, gestion_flota | Vehiculo con estado |
| **Student Card** | gestion_alumnos, student_dashboard | Alumno con avatar |
| **Class Card** | agenda_diaria, lesson_booking | Clase en calendario |
| **Role Card** | roles_y_permisos | Rol con permisos |
| **Info Card** | inicio_sesion, landing | Cards informativas con icono |

### 4.3 TABLAS

| Componente | Screens | Uso |
|-----------|---------|-----|
| **Data Table (generica)** | gestion_alumnos, gestion_profesores, panel_financiero | Cabeceras, filas, acciones |
| **Data Table + search/filtros** | gestion_alumnos_admin, gestion_flota_admin | Search + filtros + paginacion |
| **Schedule Table** | centro_horarios_admin, agenda_diaria | Parrilla horaria con slots |
| **Transaction Table** | panel_financiero_admin, billing_payments | Transacciones/pagos |

### 4.4 CALENDARIO / AGENDA

| Componente | Screens | Uso |
|-----------|---------|-----|
| **Weekly Calendar** | agenda_diaria, agenda_profesor | Time grid semanal |
| **Calendar Grid** | centro_horarios_admin | Vista mensual/semanal |
| **Date Picker** | lesson_booking_system | Selector fecha reserva |
| **Time Slots** | lesson_booking_system, centro_horarios | Slots horarios |

### 4.5 FORMULARIOS

| Componente | Screens | Uso |
|-----------|---------|-----|
| **Input Field** | TODAS | Input con icono, borde, focus ring |
| **Select Dropdown** | gestion_alumnos, config_sistema, roles | Select personalizado |
| **Date Picker** | lesson_booking, centro_horarios | Input de fecha |
| **Time Picker** | lesson_booking | Input de hora |
| **Toggle Switch** | config_sistema, roles_permisos | Toggles de activacion |
| **Search Bar** | panel_ejecutivo, gestion_alumnos, global_saas | Input + icono search |
| **Login Form** | inicio_sesion | Form completo email + password |

### 4.6 BADGES / INDICADORES

| Componente | Screens | Uso |
|-----------|---------|-----|
| **Status Badge** | gestion_alumnos, gestion_flota, incidencias | Pill shape colores |
| **Progress Bar** | theory_progress, practical_progress | Barra horizontal |
| **Progress Ring** | ai_exam_analytics_1 | SVG circle ring con dashoffset |
| **Counter Badge** | panel_ejecutivo, global_saas | Notificaciones |
| **Trend Indicator** | panel_ejecutivo, panel_financiero | Flecha + porcentaje |

### 4.7 BOTONES

| Componente | Screens | Uso |
|-----------|---------|-----|
| **Primary Button** | TODAS | bg-primary text-white rounded-lg |
| **Secondary Button** | landing, formularios | Borde outline-variant |
| **Ghost Button** | formularios, config | Sin fondo, solo texto |
| **Icon Button** | topbar, sidebar | Material Symbol + hover |

### 4.8 AVATAR / PERFIL

| Componente | Screens | Uso |
|-----------|---------|-----|
| **Avatar Circle** | panel_ejecutivo, global_saas, gestion_alumnos | w-10 h-10 rounded-full |
| **Profile Meta** | panel_profesor, global_saas | Avatar + nombre + rol |
| **User Greeting** | panel_profesor_inicio | Hero "Hola, [nombre]" |

### 4.9 MISCELANEO

| Componente | Screens | Uso |
|-----------|---------|-----|
| **Skeleton Loader** | panel_del_alumno_refinado | .skeleton con gradient animation |
| **Glass Effect** | lesson_booking, landing | backdrop-filter blur |
| **Hero Section** | landing, panel_profesor_inicio | Titulo grande + subtitulo |
| **Chart/Graph** | panel_financiero, estadisticas_rendimiento | Barras, lineas |
| **Notification Bell** | panel_ejecutivo, global_saas, panel_profesor | Icono + badge |
| **Permission Matrix** | roles_y_permisos | Grid de permisos por rol |
| **Ticket/Message** | incidencias_y_comunicaciones | Lista de tickets |

---

## 5. PATRONES DE DISENO DETECTADOS

### 5.1 Arquitectura de Layout

Hay DOS patrones de layout claramente diferenciados:

**Patron A: Layout con Sidebar + Topbar (admin y teacher)**
- Sidebar: fixed left-0 top-0 w-[280px]
- Main content: ml-[280px]
- Admin sidebar: fondo claro (surface-container-lowest)
- Teacher sidebar: fondo oscuro (on-secondary-fixed-variant)

**Patron B: Layout sin Sidebar (student puro, landing)**
- Sin sidebar fijo
- max-w-container-max
- TopAppBar siempre visible

**Patron C: Layout Shell (global_saas_layout)**
- Sidebar oscuro con navegacion completa
- Topbar glassmorphic
- Bottom nav en mobile
- viewport-fit=cover

### 5.2 Convenciones de Nomenclatura

Inconsistencias detectadas:
- Mezcla espanol/ingles: progreso_te_rico_es vs theory_progress_1
- Variantes de "refactor": refactored, refactorizado, refinado
- Sin convencion clara de sufijos de version
- global_saas_layout es el unico layout puro

### 5.3 Distribucion por Tamano

| Tamano | Cantidad | Tipo de pantalla |
|--------|----------|-----------------|
| < 300 lines | ~15 | Login, profiles compactos, analytics simples |
| 300-400 lines | ~20 | Agendas, config, roles, incidencias |
| 400-500 lines | ~17 | Dashboards completos, tablas admin |
| 500+ lines | ~5 | gestion_alumnos_admin (535), gestion_profesores (507), panel_financiero (495) |

---

## 6. RECOMENDACIONES DE CONSOLIDACION

### 6.1 Accion Inmediata: Archivar Duplicados Obvios

Mover a /legacy/archived/ (NO eliminar, mantener referencia):

**Dashboard alumno:** panel_de_control_alumno_refactorizado/, panel_de_control_alumno_refactored/, student_dashboard_1/, student_dashboard_2/

**Progreso teorico:** theory_progress_2/, progreso_te_rico_es/

**Progreso practico:** practical_skills_progress_2/, practical_progress/

**Booking:** lesson_booking_system_2/, reserva_de_clases_es/

**Perfil:** student_profile_settings_1/, student_profile_settings_2/, profile_settings/

**Pagos:** pagos_y_facturas_es/, payments_invoices_1/, payments_invoices_2/

**AI analytics:** ai_exam_analytics_2/, anal_tica_ia_es/, ai_insights/

**Panel profesor:** panel_del_profesor_refactored/, panel_del_profesor_refactorizado/

**Agenda:** agenda_del_profesor_refinado/

**Panel ejecutivo:** panel_ejecutivo_refinado/, panel_ejecutivo_refactored/, panel_ejecutivo_refactorizado/, panel_ejecutivo_mobile_fixed/

**Gestion alumnos:** gesti_n_de_alumnos_admin/, gesti_n_de_alumnos_admin_refactored/, gesti_n_de_alumnos_admin_refactorizado/

**Gestion flota:** gesti_n_de_flota_admin/, gesti_n_de_flota_refinado/, gesti_n_de_flota_mobile_fixed/

### 6.2 Pantallas Canonicas (Mantener como Referencia)

| Funcionalidad | Version Canonica | Ruta |
|--------------|-----------------|------|
| Layout Shell | global_saas_layout | global_saas_layout/ |
| Login | inicio_de_sesion | inicio_de_sesi_n/ |
| Landing Page | landing_1 | landing_page_autoescuela_camacho_1/ |
| Dashboard Alumno | panel_del_alumno_refinado | panel_del_alumno_refinado/ |
| Progreso Teorico | theory_progress_1 | theory_progress_1/ |
| Progreso Practico | practical_skills_progress_1 | practical_skills_progress_1/ |
| Booking | lesson_booking_system_1 | lesson_booking_system_1/ |
| Perfil | perfil_de_alumno_es | perfil_de_alumno_es/ |
| Pagos | billing_payments | billing_payments/ |
| AI Analytics | ai_exam_analytics_1 | ai_exam_analytics_1/ |
| Panel Profesor | panel_del_profesor_inicio | panel_del_profesor_inicio/ |
| Agenda Profesor | agenda_diaria | agenda_diaria/ |
| Panel Ejecutivo | panel_ejecutivo | panel_ejecutivo/ |
| Gestion Alumnos | gesti_n_de_alumnos | gesti_n_de_alumnos/ |
| Gestion Flota | gesti_n_de_veh_culos | gesti_n_de_veh_culos/ |
| Gestion Profesores | gesti_n_de_profesores_admin | gesti_n_de_profesores_admin/ |
| Horarios | centro_de_horarios_admin | centro_de_horarios_admin/ |
| Financiero | panel_financiero_admin | panel_financiero_admin/ |
| Config Sistema | configuraci_n_del_sistema_admin | configuraci_n_del_sistema_admin/ |
| Roles | roles_y_permisos | roles_y_permisos/ |
| Incidencias | incidencias_y_comunicaciones | incidencias_y_comunicaciones/ |
| IA Admin | ia_y_anal_tica_admin | ia_y_anal_tica_admin/ |
| Evaluacion | evaluaci_n_de_alumno | evaluaci_n_de_alumno/ |
| Estadisticas | estad_sticas_de_rendimiento | estad_sticas_de_rendimiento/ |
| Design System | vial_moderno | vial_moderno/DESIGN.md |

### 6.3 Plan de Extraccion de Componentes

**Fase 1: Tokens de Diseno** (de vial_moderno/DESIGN.md)
- Colores (ya estandarizados en tailwind config)
- Tipografia (Inter)
- Spacing (base 4px)
- Border radius

**Fase 2: Componentes Base** (de pantallas canonicas)
- StatCard, DataTable, Sidebar, TopAppBar, SearchInput
- GlassCard, ProgressBar, ProgressRing, Badge
- Button (primary/secondary/ghost), FormInput, Avatar, Calendar, TimeSlot
- Skeleton

**Fase 3: Layouts** (de global_saas_layout)
- AppLayout (sidebar + topbar + content)
- AuthLayout (centrado, sin sidebar)
- LandingLayout (header + sections + footer)

### 6.4 Roadmap Sugerido

| Semana | Actividad |
|--------|-----------|
| 1-2 | Archivar duplicados (~30 carpetas) |
| 3-4 | Extraer tokens y componentes base (~15) |
| 5-6 | Reconstruir layouts (AppLayout, AuthLayout, LandingLayout) |
| 7-8 | Reconstruir paginas funcionales |
| 9 | Testing visual vs screenshots originales |

---

## 7. PANTALLAS CANDIDATAS A ARCHIVO

### 7.1 Duplicados Exactos

| Grupo | Primera version | Version posterior |
|-------|----------------|-------------------|
| Dashboard Alumno | student_dashboard_1/2 | panel_del_alumno_refinado |
| Panel Profesor | panel_del_profesor_refactored/refactorizado | panel_del_profesor_inicio |
| Panel Ejecutivo | panel_ejecutivo | panel_ejecutivo_refinado/refactored/refactorizado |

### 7.2 Traducciones (mismo componente, distinto idioma)

| Ingles | Espanol | Decision |
|--------|---------|----------|
| theory_progress_1 | progreso_te_rico_es | Mantener 1, archivar la otra |
| lesson_booking_system_1 | reserva_de_clases_es | Mantener 1, archivar la otra |
| billing_payments | pagos_y_facturas_es | Mantener 1, archivar la otra |
| ai_exam_analytics_1 | anal_tica_ia_es | Mantener 1, archivar la otra |

### 7.3 Versiones Mobile (VARIANTES)

| Desktop | Mobile | Decision |
|---------|--------|----------|
| panel_ejecutivo | panel_ejecutivo_mobile_fixed | Mantener como ref mobile |
| gestion_flota_admin | gestion_flota_mobile_fixed | Mantener como ref mobile |

### 7.4 Screenshots sin codigo (OBSOLETAS)

| Carpeta | Accion |
|---------|--------|
| logo_camacho.png/ | Archivar |
| screencapture_*aula_virtual*.png/ | Archivar |
| screencapture_*conocenos*.png/ | Archivar |
| screencapture_*cursos*.png/ | Archivar |
| vial_moderno/ | **MANTENER** - design tokens |

---

## 8. ESTADISTICAS FINALES

### Por Rol

| Rol | Total | Unicas | Duplicados | Variantes |
|-----|-------|--------|------------|-----------|
| Landing/Auth | 3 | 2 | 0 | 1 |
| Alumno (dashboard) | 5 | 1 | 4 | 0 |
| Alumno (progreso) | 5 | 2 | 3 | 0 |
| Alumno (booking) | 3 | 1 | 1 | 1 |
| Alumno (perfil) | 4 | 1 | 3 | 0 |
| Alumno (pagos) | 4 | 1 | 2 | 1 |
| Alumno (AI) | 4 | 1 | 2 | 1 |
| Profesor | 5 | 2 | 3 | 0 |
| Admin (panel ejecutivo) | 5 | 1 | 3 | 1 |
| Admin (gestion alumnos) | 4 | 1 | 3 | 0 |
| Admin (gestion flota) | 4 | 1 | 2 | 1 |
| Admin (otros unicos) | 9 | 9 | 0 | 0 |
| Layout | 1 | 1 | 0 | 0 |
| Sin HTML | 5 | 0 | 0 | 5 |
| **TOTAL** | **62** | **24** | **29** | **9** |

### Resumen Final

- **24 pantallas unicas** que representan funcionalidad real
- **29 duplicados** que son iteraciones/refactors
- **9 variantes** (traducciones, mobile, refinamientos)
- **Tasa de redundancia efectiva: ~56%**
- **Desperdicio estimado: ~15,000 lineas de HTML duplicado**

---

## 9. CONCLUSION

El directorio /legacy/stitch-imports/ contiene esencialmente ~22-24 funcionalidades unicas replicadas en ~57 variaciones. La redundancia proviene de:

1. **Exportaciones iterativas** del disenador (refinado -> refactored -> refactorizado)
2. **Traducciones ingles/espanol** como archivos separados
3. **Adaptaciones mobile** como copias independientes
4. **Nomenclatura inconsistente** sin versionado

El design system subyacente es SOLIDO y CONSISTENTE (misma paleta Material 3, misma tipografia, mismos componentes base). La consolidacion es DIRECTA y de BAJO RIESGO.

El archivo vial_moderno/DESIGN.md es la pieza clave: contiene la especificacion completa del design system y deberia ser la base para la reconstruccion en Next.js.
