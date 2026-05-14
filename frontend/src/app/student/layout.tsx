'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/student/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/student/calendar', label: 'Calendario', icon: 'calendar_month' },
  { href: '/student/bookings', label: 'Reservas', icon: 'directions_car' },
  { href: '/student/history', label: 'Historial', icon: 'history' },
  { href: '/student/progress', label: 'Progreso', icon: 'trending_up' },
  { href: '/student/payments', label: 'Pagos', icon: 'payments' },
  { href: '/student/profile', label: 'Perfil', icon: 'person' },
];

const breadcrumbMap: Record<string, { label: string; breadcrumbs: { label: string; href?: string }[] }> = {
  '/student/dashboard': { label: 'Dashboard', breadcrumbs: [{ label: 'INICIO', href: '/student/dashboard' }, { label: 'DASHBOARD' }] },
  '/student/calendar': { label: 'Calendario', breadcrumbs: [{ label: 'INICIO', href: '/student/dashboard' }, { label: 'CALENDARIO' }] },
  '/student/bookings': { label: 'Reservas', breadcrumbs: [{ label: 'INICIO', href: '/student/dashboard' }, { label: 'RESERVAS' }] },
  '/student/history': { label: 'Historial', breadcrumbs: [{ label: 'INICIO', href: '/student/dashboard' }, { label: 'HISTORIAL' }] },
  '/student/progress': { label: 'Progreso', breadcrumbs: [{ label: 'INICIO', href: '/student/dashboard' }, { label: 'PROGRESO' }] },
  '/student/payments': { label: 'Pagos', breadcrumbs: [{ label: 'INICIO', href: '/student/dashboard' }, { label: 'PAGOS' }] },
  '/student/profile': { label: 'Perfil', breadcrumbs: [{ label: 'INICIO', href: '/student/dashboard' }, { label: 'PERFIL' }] },
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const route = breadcrumbMap[pathname] || { label: '', breadcrumbs: [] };

  return (
    <DashboardLayout
      navItems={navItems}
      role="student"
      userName="Juan"
      pageTitle={route.label}
      breadcrumbs={route.breadcrumbs}
    >
      {children}
    </DashboardLayout>
  );
}
