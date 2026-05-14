'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

export default function StudentProfile() {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-outline-variant/30 p-8 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-center">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-md">
          JP
        </div>
        <h2 className="text-headline-md font-bold text-on-surface mt-4">Juan Pérez</h2>
        <p className="text-body-sm text-on-surface-variant">juan@example.com</p>
      </div>

      {/* Info Card */}
      <Card accent>
        <CardHeader title="Información" />
        <div className="space-y-3">
          {[
            { label: 'Teléfono', value: '612 345 678' },
            { label: 'Permiso', value: 'B (Coche)' },
            { label: 'Matriculado', value: '15 enero 2025' },
            { label: 'Clases', value: '15/30' },
          ].map(i => (
            <div key={i.label} className="flex justify-between py-2 border-b border-outline-variant/20 last:border-0">
              <span className="text-body-sm text-on-surface-variant">{i.label}</span>
              <span className="text-body-sm font-medium text-on-surface">{i.value}</span>
            </div>
          ))}
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
