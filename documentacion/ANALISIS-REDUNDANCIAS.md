# Análisis de Redundancias - Pantallas Stitch

## RESUMEN EJECUTIVO

- **Total pantallas importadas**: 62
- **Funcionalidades únicas**: ~20
- **Redundancia detectada**: ~40 pantallas duplicadas

---

## ALUMNO - Redundancias Detectadas

### Dashboard/Panel de Control
| Archivo | Estado |
|---------|--------|
| panel_del_alumno_refinado | ✓ ÚNICO |
| panel_de_control_alumno_refactorizado | DUPLICADO |
| panel_de_control_alumno_refactored | DUPLICADO |
| student_dashboard_1 | DUPLICADO |
| student_dashboard_2 | DUPLICADO |

** Recomendación **: Consolidar en 1 panel de control unificado

### Progreso Teórico
| Archivo | Estado |
|---------|--------|
| theory_progress_1 | ÚNICO |
| theory_progress_2 | DUPLICADO |
| progreso_te_rico_es | DUPLICADO |
| theoretical_progress | DUPLICADO |

### Progreso Práctico
| Archivo | Estado |
|---------|--------|
| practical_skills_progress_1 | ÚNICO |
| practical_skills_progress_2 | DUPLICADO |
| practical_progress | DUPLICADO |

### Reserva de Clases
| Archivo | Estado |
|---------|--------|
| lesson_booking_system_1 | ÚNICO |
| lesson_booking_system_2 | DUPLICADO |
| reserva_de_clases_es | DUPLICADO |

### Perfil de Alumno
| Archivo | Estado |
|---------|--------|
| perfil_de_alumno_es | ÚNICO |
| perfil_de_alumno_refinado | DUPLICADO |
| student_profile_settings_1 | DUPLICADO |
| student_profile_settings_2 | DUPLICADO |
| perfl_de_alumno | DUPLICADO |

### Pagos y Facturas
| Archivo | Estado |
|---------|--------|
| billing_payments | ÚNICO |
| pagos_y_facturas_es | DUPLICADO |
| payments_invoices_1 | DUPLICADO |
| payments_invoices_2 | DUPLICADO |

### AI Analytics
| Archivo | Estado |
|---------|--------|
| ai_exam_analytics_1 | ÚNICO |
| ai_exam_analytics_2 | DUPLICADO |
| anal_tica_ia_es | DUPLICADO |
| ai_insights | DUPLICADO |

---

## PROFESOR - Redundancias Detectadas

### Panel del Profesor
| Archivo | Estado |
|---------|--------|
| panel_del_profesor_inicio | ÚNICO |
| panel_del_profesor_refactored | DUPLICADO |
| panel_del_profesor_refactorizado | DUPLICADO |

### Agenda
| Archivo | Estado |
|---------|--------|
| agenda_diaria | ÚNICO |
| agenda_diaria_refinado | DUPLICADO |
| agenda_del_profesor_refinado | DUPLICADO |

---

## ADMIN - Redundancias Detectadas

### Panel Ejecutivo
| Archivo | Estado |
|---------|--------|
| panel_ejecutivo | ÚNICO |
| panel_ejecutivo_refinado | DUPLICADO |
| panel_ejecutivo_refactored | DUPLICADO |
| panel_ejecutivo_refactorizado | DUPLICADO |
| panel_ejecutivo_mobile_fixed | VARIANTE MOBILE |

### Gestión de Alumnos
| Archivo | Estado |
|---------|--------|
| gesti_n_de_alumnos | ÚNICO |
| gesti_n_de_alumnos_admin | DUPLICADO |
| gesti_n_de_alumnos_admin_refactored | DUPLICADO |
| gesti_n_de_alumnos_admin_refactorizado | DUPLICADO |

### Gestión de Flota
| Archivo | Estado |
|---------|--------|
| gesti_n_de_veh_culos | ÚNICO |
| gesti_n_de_flota_admin | DUPLICADO |
| gesti_n_de_flota_refinado | DUPLICADO |
| gesti_n_de_flota_mobile_fixed | VARIANTE MOBILE |

### Otros paneles admin
| Archivo | Estado |
|---------|--------|
| gesti_n_de_profesores_admin | ÚNICO |
| centro_de_horarios_admin | ÚNICO |
| panel_financiero_admin | ÚNICO |
| configuraci_n_del_sistema_admin | ÚNICO |
| roles_y_permisos | ÚNICO |

---

## COMPONENTES REUTILIZABLES IDENTIFICADOS

### Navegación
- Navbar principal
- Sidebar (admin)
- Bottom navigation (mobile)

### Cards
- Stat card
- Class card
- Vehicle card
- Student card

### Tablas
- Data table genérica
- Tabla con filtros
- Tabla de horarios

### Calendario
- Weekly calendar
- Daily calendar
- Month calendar

### Formularios
- Input fields
- Select dropdowns
- Date pickers
- Time pickers

### Badges/Indicadores
- Status badges
- Progress indicators
- Counter badges

### Botones
- Primary button
- Secondary button
- Icon button
- FAB (Floating Action Button)

---

## ACCIONES RECOMENDADAS

### Fase 1: Consolidación
1. [ ] Eliminar carpetas duplicadas (mantener solo versiones "refinado" o más recientes)
2. [ ] Documentar versión oficial de cada pantalla

### Fase 2: Extracción
1. [ ] Extraer componentes shared a `/components`
2. [ ] Crear design system base
3. [ ] Normalizar colors, spacing, typography

### Fase 3: Reconstrucción
1. [ ] Crear estructura Next.js limpia
2. [ ] Implementar páginas basadas en arquitectura nueva
3. [ ] Usar pantallas Stitch solo como referencia visual