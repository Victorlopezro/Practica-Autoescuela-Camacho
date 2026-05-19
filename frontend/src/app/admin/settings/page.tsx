'use client';

import { Card } from '@/components/layouts/Card';

/**
 * BACKLOG: Pendiente de endpoint de configuración del backend.
 * Cuando esté disponible, reemplazar datos mock.
 */

const settings = [
  { label: 'Festivos', desc: 'Gestionar días festivos', icon: 'celebration' },
  { label: 'Bloqueos', desc: 'Bloqueos de horarios', icon: 'block' },
  { label: 'Roles y permisos', desc: 'Gestionar accesos', icon: 'manage_accounts' },
  { label: 'Preferencias', desc: 'Configurar notificaciones', icon: 'notifications' },
];

export default function AdminSettings() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-2">
          {settings.map(s => (
            <div key={s.label} className="flex justify-between items-center p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{s.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">{s.label}</p>
                  <p className="text-xs text-on-surface-variant">{s.desc}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline">chevron_right</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
