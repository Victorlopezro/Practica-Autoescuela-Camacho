'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  role: 'student' | 'teacher' | 'admin';
  userName?: string;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardLayout({
  children,
  navItems,
  role,
  userName,
  pageTitle,
  breadcrumbs,
}: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Sidebar */}
      <aside className="w-[280px] h-full fixed left-0 top-0 hidden md:block bg-[#2b3f94] shadow-md z-50">
        <div className="flex flex-col h-full py-md">
          {/* Brand / Logo */}
          <div className="px-6 mb-8">
            <img src="/logo-white.svg" alt="Autoescuela Camacho" className="h-14 w-auto mb-2" />
            <p className="text-body-sm text-surface-container-high opacity-80">
              {role === 'student' ? 'Portal del Estudiante' : role === 'teacher' ? 'Portal del Profesor' : 'Panel de Administración'}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all active:scale-95 duration-150',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-surface-container-high hover:bg-white/10'
                  )}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-body-base">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Profile */}
          <div className="px-6 mt-auto">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-sm font-semibold text-on-primary-container">
                {userName ? userName.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-white text-label-caps leading-[16px] font-bold">{userName || 'Usuario'}</span>
                <span className="text-surface-container-high text-[10px] opacity-60">v2.1.0</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Shell */}
      <div className="md:ml-[280px] min-h-screen flex flex-col">
        {/* Top Bar */}
        <Navbar userName={userName} userRole={role} />

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="px-gutter py-4 max-w-[1280px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-on-surface-variant text-label-caps leading-[16px] overflow-x-auto whitespace-nowrap">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="material-symbols-outlined text-[14px]">chevron_right</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-primary transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={i === breadcrumbs.length - 1 ? 'text-primary font-bold' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        )}

        {/* Page Title */}
        {pageTitle && (
          <div className="px-gutter pb-4 max-w-[1280px] mx-auto w-full">
            <h1 className="text-headline-md leading-[32px] font-bold text-on-surface">{pageTitle}</h1>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 px-gutter pb-xl max-w-[1280px] mx-auto w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full py-xl bg-surface-container-low border-t border-outline-variant">
          <div className="flex flex-col md:flex-row justify-between items-center px-gutter max-w-[1280px] mx-auto gap-6">
            <div>
              <span className="text-body-base font-bold text-on-surface">Autoescuela Camacho</span>
              <p className="text-body-sm text-on-surface-variant mt-1">© 2026 Autoescuela Camacho. Todos los derechos reservados.</p>
            </div>
            <div className="flex gap-6">
              <span className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Política de Privacidad</span>
              <span className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Términos de Servicio</span>
              <span className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Soporte</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav role={role} />
    </div>
  );
}
