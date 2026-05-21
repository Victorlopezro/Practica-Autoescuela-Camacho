'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/reservations', label: 'Reservas', icon: 'book_online' },
  { href: '/admin/students', label: 'Alumnos', icon: 'group' },
  { href: '/admin/teachers', label: 'Profesores', icon: 'badge' },
  { href: '/admin/vehicles', label: 'Vehículos', icon: 'directions_car' },
  { href: '/admin/schedules', label: 'Horarios', icon: 'calendar_month' },
  { href: '/admin/payments', label: 'Pagos', icon: 'payments' },
  { href: '/admin/analytics', label: 'Analíticas', icon: 'analytics' },
  { href: '/admin/settings', label: 'Ajustes', icon: 'settings' },
];

const breadcrumbMap: Record<string, { label: string; breadcrumbs: { label: string; href?: string }[] }> = {
  '/admin/dashboard': { label: 'Panel de control', breadcrumbs: [{ label: 'INICIO', href: '/admin/dashboard' }, { label: 'PANEL' }] },
  '/admin/reservations': { label: 'Gestión de Reservas', breadcrumbs: [{ label: 'INICIO', href: '/admin/dashboard' }, { label: 'RESERVAS' }] },
  '/admin/students': { label: 'Gestión de Alumnos', breadcrumbs: [{ label: 'INICIO', href: '/admin/dashboard' }, { label: 'ALUMNOS' }] },
  '/admin/teachers': { label: 'Gestión de Profesores', breadcrumbs: [{ label: 'INICIO', href: '/admin/dashboard' }, { label: 'PROFESORES' }] },
  '/admin/vehicles': { label: 'Gestión de Vehículos', breadcrumbs: [{ label: 'INICIO', href: '/admin/dashboard' }, { label: 'VEHÍCULOS' }] },
  '/admin/schedules': { label: 'Centro de Horarios', breadcrumbs: [{ label: 'INICIO', href: '/admin/dashboard' }, { label: 'HORARIOS' }] },
  '/admin/payments': { label: 'Pagos y Facturas', breadcrumbs: [{ label: 'INICIO', href: '/admin/dashboard' }, { label: 'PAGOS' }] },
  '/admin/analytics': { label: 'Analíticas', breadcrumbs: [{ label: 'INICIO', href: '/admin/dashboard' }, { label: 'ANALÍTICAS' }] },
  '/admin/settings': { label: 'Configuración', breadcrumbs: [{ label: 'INICIO', href: '/admin/dashboard' }, { label: 'CONFIGURACIÓN' }] },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const route = breadcrumbMap[pathname] || { label: '', breadcrumbs: [] };

  return (
    <DashboardLayout
      navItems={navItems}
      role="admin"
      userName="Admin"
      pageTitle={route.label}
      breadcrumbs={route.breadcrumbs}
    >
      {children}
    </DashboardLayout>
  );
}
