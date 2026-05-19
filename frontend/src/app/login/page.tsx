'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/providers/auth-provider';

const roles = [
  { id: 'student' as const, label: 'Alumno', icon: 'school' },
  { id: 'teacher' as const, label: 'Profesor', icon: 'badge' },
  { id: 'admin' as const, label: 'Admin', icon: 'admin_panel_settings' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(username, password);
      router.push(`/${role}/dashboard`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Credenciales inválidas');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* Left Panel — Branding (visible on desktop) */}
      <aside className="hidden md:flex md:w-[480px] lg:w-[560px] bg-[#2b3f94] flex-col justify-between p-6 relative overflow-hidden shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5" />

        {/* Top */}
        <div className="relative z-10">
          <div className="mb-6">
            <img src="/logo-white.svg" alt="Autoescuela Camacho" className="h-14 w-auto" />
            <p className="text-white/70 text-sm mt-1">Portal del Estudiante</p>
          </div>

          <div className="mt-6">
            <h1 className="text-white text-[40px] lg:text-[52px] font-bold leading-[1.1] tracking-[-0.02em] mb-4">
              Tu licencia al primer intento
            </h1>
            <p className="text-white text-sm">
              Reserva clases prácticas y sigue tu progreso desde cualquier dispositivo
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 text-white/70">
            <div className="flex -space-x-2">
              {['JP', 'MG', 'PL'].map((initials, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container border-2 border-[#2b3f94]">
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-sm opacity-80">+500 alumnos activos</p>
          </div>
        </div>
      </aside>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden border-b border-outline-variant/30 bg-surface px-gutter h-16 flex items-center shrink-0">
          <Link href="/">
            <img src="/logo.svg" alt="Autoescuela Camacho" className="h-9 w-auto" />
          </Link>
        </header>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-end px-gutter h-16 shrink-0">
          <p className="text-body-sm text-on-surface-variant">
            ¿No tienes cuenta? <span className="text-primary font-semibold hover:underline cursor-pointer">Solicitar acceso</span>
          </p>
        </div>

        {/* Centered form — separate height fill from width */}
        <div className="flex-1 flex flex-col min-h-0">
          <main className="flex-1 flex flex-col items-center justify-center px-gutter py-xl md:py-0">
            <div className="w-full max-w-[400px] lg:max-w-[460px]">
              {/* Welcome */}
              <div className="mb-lg">
                <h2 className="text-headline-md font-bold text-on-surface mb-xs">
                  Iniciar sesión
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Selecciona tu perfil e ingresa tus credenciales
                </p>
              </div>

              {/* Card */}
              <div className="bg-surface-container-lowest shadow-[0_4px_24px_rgba(0,0,0,0.08)] rounded-2xl p-lg md:p-xl border border-outline-variant/30">
                {/* Role Selector */}
                <div className="mb-md">
                  <label className="text-label-caps font-semibold text-on-surface-variant uppercase mb-xs block">
                    Tipo de usuario
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                          role === r.id
                            ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                            : 'bg-white border border-outline-variant/50 text-on-surface-variant hover:border-primary/30 hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">{r.icon}</span>
                        <span className="text-xs">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Field */}
                <div className="flex flex-col gap-xs mb-md">
                  <label className="text-label-caps font-semibold text-on-surface-variant uppercase" htmlFor="email">
                    Email o Usuario
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">person</span>
                    <input
                      id="email"
                      type="text"
                      placeholder="ejemplo@correo.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-body-base"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-xs">
                  <label className="text-label-caps font-semibold text-on-surface-variant uppercase" htmlFor="password">
                    Contraseña
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">lock</span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-10 pr-12 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-body-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-primary flex items-center justify-center hover:bg-surface-container rounded-full p-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <div className="flex justify-end mt-xs">
                    <a className="text-body-sm text-primary font-semibold hover:underline cursor-pointer">
                      ¿Has olvidado tu contraseña?
                    </a>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-md p-3 bg-error-container text-on-error-container rounded-xl text-body-sm">
                    {error}
                  </div>
                )}

                {/* Login Button */}
                <button
                  onClick={handleLogin}
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white text-headline-md font-semibold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all hover:bg-primary/90 flex items-center justify-center gap-2 mt-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_top' : 'login'}</span>
                </button>
              </div>

              {/* Mobile-only info cards */}
              <div className="mt-lg grid grid-cols-1 gap-md md:hidden">
                <div className="flex items-center gap-md p-md bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="w-10 h-10 bg-secondary-container flex items-center justify-center rounded-lg shrink-0">
                    <span className="material-symbols-outlined text-secondary text-[20px]">assignment</span>
                  </div>
                  <div>
                    <h3 className="text-body-sm font-bold text-on-surface">Tests Actualizados</h3>
                    <p className="text-body-sm text-on-surface-variant">Preguntas DGT recientes.</p>
                  </div>
                </div>
                <div className="flex items-center gap-md p-md bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="w-10 h-10 bg-tertiary-fixed flex items-center justify-center rounded-lg shrink-0">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">directions_car</span>
                  </div>
                  <div>
                    <h3 className="text-body-sm font-bold text-on-surface">Clases Prácticas</h3>
                    <p className="text-body-sm text-on-surface-variant">Reserva tu clase online.</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Desktop footer */}
        <footer className="hidden md:block border-t border-outline-variant/30 bg-surface shrink-0">
          <div className="px-gutter py-md">
            <div className="flex justify-between items-center">
              <p className="text-body-sm text-on-surface-variant opacity-60">
                © 2026 Autoescuela Camacho
              </p>
              <div className="flex gap-6">
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Privacidad</a>
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Términos</a>
                <a className="text-body-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Soporte</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Mobile footer */}
        <footer className="md:hidden border-t border-outline-variant/30 bg-surface px-gutter py-md text-center shrink-0">
          <p className="text-body-sm text-on-surface-variant opacity-60">
            © 2026 Autoescuela Camacho
          </p>
        </footer>
      </div>
    </div>
  );
}