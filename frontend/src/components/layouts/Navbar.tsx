'use client';

import Link from 'next/link';
import { BRANDING } from '@/lib/constants';

interface NavbarProps {
  userName?: string;
  userRole?: 'student' | 'teacher' | 'admin';
}

export function Navbar({ userName, userRole }: NavbarProps) {
  return (
    <header className="w-full sticky top-0 z-40 bg-surface/80 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center px-gutter h-16 max-w-[1280px] mx-auto w-full">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button className="md:hidden text-primary p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          {/* Logo for mobile */}
          <Link href="/" className="md:hidden">
            <img src="/logo.svg" alt="Autoescuela Camacho" className="h-8 w-auto" />
          </Link>
          {/* Desktop title */}
          <div className="hidden md:flex items-center">
            <Link href="/">
              <img src="/logo.svg" alt="Autoescuela Camacho" className="h-10 w-auto" />
            </Link>
          </div>
        </div>

        {/* Search (desktop) */}
        <div className="hidden sm:flex flex-1 max-w-md mx-8">
          <div className="relative w-full focus-within:ring-2 focus-within:ring-primary rounded-lg transition-all">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              className="w-full bg-surface-container-low border-none rounded-lg py-2 pl-10 pr-4 text-body-base focus:ring-0 outline-none"
              placeholder="Buscar clases, tests o materiales..."
              type="text"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button className="sm:hidden text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="relative text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
          {userName && (
            <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="text-label-caps text-on-surface-variant">{userRole === 'student' ? 'ALUMNO' : userRole === 'teacher' ? 'PROFESOR' : 'ADMIN'}</span>
                <div className="w-8 h-8 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-sm font-semibold">
                  {userName.charAt(0)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}