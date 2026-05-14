export const BRANDING = {
  name: 'Autoescuela Camacho',
  colors: {
    primary: '#00628c',
    secondary: '#4558ae',
    tertiary: '#825100',
    error: '#ba1a1a',
    success: '#1b7a3e',
    warning: '#a36700',
  },
  fonts: {
    main: 'Inter',
  },
} as const;

export const ROUTES = {
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
  },
  student: {
    dashboard: '/student/dashboard',
    calendar: '/student/calendar',
    bookings: '/student/bookings',
    history: '/student/history',
    profile: '/student/profile',
    payments: '/student/payments',
    progress: '/student/progress',
  },
  teacher: {
    dashboard: '/teacher/dashboard',
    calendar: '/teacher/calendar',
    schedule: '/teacher/schedule',
    students: '/teacher/students',
    incidents: '/teacher/incidents',
    profile: '/teacher/profile',
  },
  admin: {
    dashboard: '/admin/dashboard',
    students: '/admin/students',
    teachers: '/admin/teachers',
    vehicles: '/admin/vehicles',
    schedules: '/admin/schedules',
    payments: '/admin/payments',
    analytics: '/admin/analytics',
    settings: '/admin/settings',
  },
} as const;

export const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

export const LICENSE_TYPES = {
  B: { label: 'Coche (B)', description: 'Vehículos de categoría B' },
  A: { label: 'Motocicleta (A)', description: 'Motocicletas' },
  C: { label: 'Camión (C)', description: 'Vehículos de carga' },
  D: { label: 'Autobús (D)', description: 'Vehículos de transporte' },
  AM: { label: 'Ciclomotor (AM)', description: 'Ciclomotores' },
} as const;

export const BOOKING_STATUSES = {
  pending: { label: 'Pendiente', color: 'warning' },
  confirmed: { label: 'Confirmada', color: 'primary' },
  completed: { label: 'Completada', color: 'success' },
  cancelled: { label: 'Cancelada', color: 'error' },
  no_show: { label: 'No presentada', color: 'error' },
} as const;