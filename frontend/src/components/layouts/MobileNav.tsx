'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const studentLinks = [
  { href: '/student/dashboard', label: 'Inicio', icon: 'home' },
  { href: '/student/calendar', label: 'Calendario', icon: 'calendar_month' },
  { href: '/student/bookings', label: 'Clases', icon: 'directions_car' },
  { href: '/student/profile', label: 'Perfil', icon: 'person' },
];

const teacherLinks = [
  { href: '/teacher/dashboard', label: 'Inicio', icon: 'home' },
  { href: '/teacher/calendar', label: 'Horario', icon: 'calendar_month' },
  { href: '/teacher/students', label: 'Alumnos', icon: 'group' },
  { href: '/teacher/profile', label: 'Perfil', icon: 'person' },
];

const adminLinks = [
  { href: '/admin/dashboard', label: 'Panel', icon: 'dashboard' },
  { href: '/admin/students', label: 'Alumnos', icon: 'group' },
  { href: '/admin/teachers', label: 'Profesores', icon: 'badge' },
  { href: '/admin/vehicles', label: 'Flota', icon: 'directions_car' },
];

export function MobileNav({ role }: { role: 'student' | 'teacher' | 'admin' }) {
  const pathname = usePathname();
  const links = role === 'student' ? studentLinks : role === 'teacher' ? teacherLinks : adminLinks;

  return (
    <nav className="fixed bottom-0 w-full md:hidden rounded-t-xl bg-surface border-t border-outline-variant/30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all active:bg-surface-container ${
              pathname === link.href
                ? 'text-primary font-semibold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">{link.icon}</span>
            <span className="text-label-caps leading-[16px] mt-0.5">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}