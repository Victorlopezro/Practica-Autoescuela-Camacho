'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/teacher/calendar', label: 'Calendario', icon: 'calendar_month' },
  { href: '/teacher/schedule', label: 'Horario', icon: 'schedule' },
  { href: '/teacher/students', label: 'Alumnos', icon: 'group' },
  { href: '/teacher/incidents', label: 'Incidencias', icon: 'report' },
  { href: '/teacher/profile', label: 'Perfil', icon: 'person' },
];

const breadcrumbMap: Record<string, { label: string; breadcrumbs: { label: string; href?: string }[] }> = {
  '/teacher/dashboard': { label: 'Mi día', breadcrumbs: [{ label: 'INICIO', href: '/teacher/dashboard' }, { label: 'MI DÍA' }] },
  '/teacher/calendar': { label: 'Calendario', breadcrumbs: [{ label: 'INICIO', href: '/teacher/dashboard' }, { label: 'CALENDARIO' }] },
  '/teacher/schedule': { label: 'Horario', breadcrumbs: [{ label: 'INICIO', href: '/teacher/dashboard' }, { label: 'HORARIO' }] },
  '/teacher/students': { label: 'Alumnos', breadcrumbs: [{ label: 'INICIO', href: '/teacher/dashboard' }, { label: 'ALUMNOS' }] },
  '/teacher/incidents': { label: 'Incidencias', breadcrumbs: [{ label: 'INICIO', href: '/teacher/dashboard' }, { label: 'INCIDENCIAS' }] },
  '/teacher/profile': { label: 'Perfil', breadcrumbs: [{ label: 'INICIO', href: '/teacher/dashboard' }, { label: 'PERFIL' }] },
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const route = breadcrumbMap[pathname] || { label: '', breadcrumbs: [] };

  return (
    <DashboardLayout
      navItems={navItems}
      role="teacher"
      userName="Carlos"
      pageTitle={route.label}
      breadcrumbs={route.breadcrumbs}
    >
      {children}
    </DashboardLayout>
  );
}
