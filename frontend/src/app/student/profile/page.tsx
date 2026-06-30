'use client';

import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { StudentDto } from '@/services/interfaces';

function getInitials(name?: string | null, lastName?: string | null): string {
  const first = name?.charAt(0) ?? '';
  const last = lastName?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const { data: profile, isLoading, error, refresh } = useData<StudentDto>(
    () => services.student.getProfile(user?.studentId ?? ''),
    [user?.studentId]
  );

  return (
    <DataView
      data={profile}
      isLoading={isLoading}
      error={error}
      onRetry={refresh}
    >
      {(profile) => (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-xl border border-outline-variant/30 p-8 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-md">
              {getInitials(user?.name, user?.lastName)}
            </div>
            <h2 className="text-headline-md font-bold text-on-surface mt-4">{user?.name} {user?.lastName}</h2>
            <p className="text-body-sm text-on-surface-variant">{user?.email}</p>
          </div>

          {/* Info Card */}
          <Card accent>
            <CardHeader title="Información" />
            <div className="space-y-3">
              {[
                { label: 'Teléfono', value: user?.phone ?? '—' },
                { label: 'Permiso', value: 'B (Coche)' },
                { label: 'Clases restantes', value: String(profile.remainingClasses) },
              ].map(i => (
                <div key={i.label} className="flex justify-between py-2 border-b border-outline-variant/20 last:border-0">
                  <span className="text-body-sm text-on-surface-variant">{i.label}</span>
                  <span className="text-body-sm font-medium text-on-surface">{i.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full bg-white border border-outline-variant text-on-surface-variant py-3 rounded-lg text-body-sm font-medium hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar sesión
          </button>
        </div>
      )}
    </DataView>
  );
}
