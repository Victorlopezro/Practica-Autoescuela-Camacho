'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

const quickStats = [
  { label: 'Clases restantes', value: '15', color: 'text-primary' },
  { label: 'Progreso teórico', value: '65%', color: 'text-secondary' },
  { label: 'Próxima clase', value: 'Mañana', color: 'text-tertiary' },
];

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {quickStats.map(s => (
          <Card key={s.label} className="text-center">
            <p className={`text-headline-md font-bold ${s.color}`}>{s.value}</p>
            <p className="text-label-caps text-on-surface-variant mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Status Card */}
        <div className="md:col-span-8 bg-white rounded-xl border border-outline-variant/30 p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-on-surface">Licencia Clase B</h3>
              <p className="text-body-sm text-on-surface-variant">Progreso hacia tu examen teórico</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full">
              <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
              <span className="text-label-caps text-primary font-bold">EN RITMO</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-label-caps text-on-surface-variant">
              <span>COMPLETADO</span>
              <span className="text-primary font-bold">68%</span>
            </div>
            <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '68%' }}></div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div><span className="text-on-surface-variant text-[10px] text-label-caps">CLASES</span><p className="text-headline-md font-bold text-on-surface">24/32</p></div>
            <div><span className="text-on-surface-variant text-[10px] text-label-caps">TESTS</span><p className="text-headline-md font-bold text-on-surface">12</p></div>
            <div><span className="text-on-surface-variant text-[10px] text-label-caps">NOTA MEDIA</span><p className="text-headline-md font-bold text-secondary">92%</p></div>
            <div><span className="text-on-surface-variant text-[10px] text-label-caps">PRÁCTICA</span><p className="text-headline-md font-bold text-on-surface">4h</p></div>
          </div>
        </div>

        {/* Book CTA Card */}
        <div className="md:col-span-4 bg-[#2b3f94] rounded-xl p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <span className="material-symbols-outlined text-[32px] mb-4">calendar_month</span>
            <h3 className="font-semibold leading-tight mb-2">Reservar Clases</h3>
            <p className="text-surface-container-high text-body-sm opacity-90">Asegura tu sitio con el Instructor Camacho para la próxima semana.</p>
          </div>
          <button className="mt-6 w-full py-3 bg-white text-[#2b3f94] rounded-lg font-bold text-label-caps hover:bg-surface-container transition-colors active:scale-95 duration-150 cursor-pointer">
            PROGRAMAR AHORA
          </button>
        </div>

        {/* Glassmorphism stats */}
        <div className="md:col-span-4 bg-white/60 backdrop-blur-sm rounded-xl border border-outline-variant/20 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">menu_book</span>
            </div>
            <div>
              <p className="text-body-sm text-on-surface-variant">Señales</p>
              <p className="text-headline-md font-bold text-on-surface">Tema 4</p>
            </div>
          </div>
        </div>
        <div className="md:col-span-4 bg-white/60 backdrop-blur-sm rounded-xl border border-outline-variant/20 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">history_edu</span>
            </div>
            <div>
              <p className="text-body-sm text-on-surface-variant">Último examen</p>
              <p className="text-headline-md font-bold text-on-surface">Aprobado</p>
            </div>
          </div>
        </div>
        <div className="md:col-span-4 bg-white/60 backdrop-blur-sm rounded-xl border border-outline-variant/20 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-tertiary-fixed rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">timer</span>
            </div>
            <div>
              <p className="text-body-sm text-on-surface-variant">Tiempo estudio</p>
              <p className="text-headline-md font-bold text-on-surface">18.5h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progreso */}
      <Card accent>
        <CardHeader title="Progreso" subtitle="Tu avance general" />
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-body-sm mb-1">
              <span>Teoría</span>
              <span className="font-medium">65%</span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-body-sm mb-1">
              <span>Práctica</span>
              <span className="font-medium">40%</span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
