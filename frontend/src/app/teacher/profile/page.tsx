'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

export default function TeacherProfile() {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-outline-variant/30 p-8 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-center">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-md">
          CM
        </div>
        <h2 className="text-headline-md font-bold text-on-surface mt-4">Carlos Martínez</h2>
        <p className="text-body-sm text-on-surface-variant">carlos@example.com</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="material-symbols-outlined text-tertiary text-[18px]">star</span>
          <span className="font-medium text-on-surface">4.8</span>
        </div>
      </div>

      {/* Stats */}
      <Card accent>
        <CardHeader title="Estadísticas" />
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-surface-container-low rounded-xl">
            <p className="text-display-lg-mobile font-bold text-secondary">12</p>
            <p className="text-label-caps text-on-surface-variant">Alumnos</p>
          </div>
          <div className="text-center p-4 bg-surface-container-low rounded-xl">
            <p className="text-display-lg-mobile font-bold text-secondary">156</p>
            <p className="text-label-caps text-on-surface-variant">Clases totales</p>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <button className="w-full bg-white border border-outline-variant text-on-surface-variant py-3 rounded-lg text-body-sm font-medium hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-[18px]">logout</span>
        Cerrar sesión
      </button>
    </div>
  );
}
