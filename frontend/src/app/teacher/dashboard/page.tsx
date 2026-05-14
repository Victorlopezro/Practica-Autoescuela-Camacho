'use client';

const todayClasses = [
  { time: '09:00', student: 'Juan P.', type: 'Práctica B', status: 'Completada' },
  { time: '10:00', student: 'María G.', type: 'Práctica B', status: 'En curso' },
  { time: '11:00', student: 'Pedro L.', type: 'Práctica B', status: 'Pendiente' },
  { time: '12:00', student: 'Ana M.', type: 'Práctica A', status: 'Pendiente' },
];

const statusStyles: Record<string, string> = {
  'Completada': 'bg-surface-container text-on-surface-variant',
  'En curso': 'bg-primary-container text-primary font-semibold',
  'Pendiente': 'bg-tertiary-fixed text-tertiary',
};

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-outline-variant/30 p-5 text-center shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <p className="text-headline-md font-bold text-primary">4</p>
          <p className="text-label-caps text-on-surface-variant mt-1">Clases hoy</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/30 p-5 text-center shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <p className="text-headline-md font-bold text-secondary">3</p>
          <p className="text-label-caps text-on-surface-variant mt-1">Alumnos hoy</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/30 p-5 text-center shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <p className="text-headline-md font-bold text-tertiary">56</p>
          <p className="text-label-caps text-on-surface-variant mt-1">Total clases</p>
        </div>
      </div>

      {/* Today's schedule */}
      <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">schedule</span>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface">Clases de hoy</h3>
            <p className="text-body-sm text-on-surface-variant">14 de mayo</p>
          </div>
        </div>
        <div className="space-y-2">
          {todayClasses.map(c => (
            <div key={c.time} className="flex items-center justify-between py-3 px-4 bg-surface-container-low rounded-lg">
              <div className="flex items-center gap-4">
                <span className="font-bold text-primary w-12 text-body-base">{c.time}</span>
                <div>
                  <p className="text-body-sm font-medium text-on-surface">{c.student}</p>
                  <p className="text-body-sm text-on-surface-variant">{c.type}</p>
                </div>
              </div>
              <span className={`text-label-caps px-3 py-1 rounded-full ${statusStyles[c.status] || ''}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next class highlight */}
      <div className="bg-[#2b3f94] rounded-xl p-6 text-white shadow-md">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-[36px]">school</span>
          <div>
            <h3 className="font-semibold mb-1">Próxima clase: 11:00</h3>
            <p className="text-body-sm text-surface-container-high opacity-90">
              Pedro L. — Práctica B — Recoger en la autoescuela
            </p>
            <div className="flex gap-3 mt-4">
              <button className="px-4 py-2 bg-white text-[#2b3f94] rounded-lg text-label-caps font-bold hover:bg-surface-container transition-colors cursor-pointer">
                VER DETALLES
              </button>
              <button className="px-4 py-2 border border-white/30 text-white rounded-lg text-label-caps font-bold hover:bg-white/10 transition-colors cursor-pointer">
                NOTIFICAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
