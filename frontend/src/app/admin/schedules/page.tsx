'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { Modal } from '@/components/shared/Modal';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { AdminPlanningDto, DayPlanningDto, PlanningReservationDto } from '@/lib/dto/admin-planning.dto';
import { AdminTeacherScheduleManager } from './AdminTeacherScheduleManager';

/* ─── Helpers ─────────────────────────────────────────────────── */

function formatDateHeader(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(iso: string): string {
  // Times come from the backend as UTC ISO strings — extract HH:mm directly to avoid timezone offset.
  return iso.substring(11, 16);
}

const VEHICLE_LABELS: Record<string, string> = {
  'car': '🚗',
  'coche': '🚗',
  'motorcycle': '🏍️',
  'moto': '🏍️',
  'coche-manual': '🚗 manual',
  'coche-automatico': '🚗 auto',
  'moto-pista': '🏍️ pista',
  'moto-circulacion': '🏍️ circ.',
};

function getVehicleLabel(vt: string): string {
  return VEHICLE_LABELS[vt] ?? vt;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

/* ─── Cell color helpers ──────────────────────────────────────── */

type CellColors = { bg: string; text: string; border: string; display: string };

function getCellColors(day: DayPlanningDto): CellColors {
  if (!day.isAvailable) {
    return { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200', display: '—' };
  }
  if (day.freeSlots === day.totalSlots && day.totalSlots > 0) {
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', display: `${day.bookedSlots}/${day.totalSlots}` };
  }
  if (day.freeSlots > 0) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', display: `${day.bookedSlots}/${day.totalSlots}` };
  }
  // freeSlots === 0 && isAvailable
  return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', display: `${day.bookedSlots}/${day.totalSlots}` };
}

type MobileCardColors = { bg: string; text: string; dot: string };

function getMobileCardColors(day: DayPlanningDto | null): MobileCardColors {
  if (!day || !day.isAvailable) {
    return { bg: 'bg-gray-50/50', text: 'text-gray-400', dot: 'bg-gray-400' };
  }
  if (day.freeSlots === day.totalSlots && day.totalSlots > 0) {
    return { bg: 'bg-green-50/50', text: 'text-green-700', dot: 'bg-green-500' };
  }
  if (day.freeSlots > 0) {
    return { bg: 'bg-yellow-50/50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
  }
  return { bg: 'bg-red-50/50', text: 'text-red-700', dot: 'bg-red-500' };
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function AdminSchedulesPage() {
  const today = new Date().toISOString().split('T')[0];
  const [rangeStart, setRangeStart] = useState(today);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [planningMode, setPlanningMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mobileDay, setMobileDay] = useState(today);

  const rangeEnd = useMemo(() => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + 29);
    return d.toISOString().split('T')[0];
  }, [rangeStart]);

  const rangeLabel = useMemo(() => {
    const start = new Date(rangeStart + 'T12:00:00');
    const end = new Date(rangeEnd + 'T12:00:00');
    return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [rangeStart, rangeEnd]);

  const { data, isLoading, error, refresh } = useData<AdminPlanningDto>(
    () => services.admin.getPlanning(rangeStart, rangeEnd),
    [rangeStart],
  );

  /* ── 30-day calendar days for mobile ────────────────────────── */

  const calendarDays = useMemo(() => {
    const start = new Date(rangeStart + 'T12:00:00');
    const days: Array<{ date: string; day: number; isToday: boolean }> = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        day: d.getDate(),
        isToday: d.toISOString().split('T')[0] === today,
      });
    }
    return days;
  }, [rangeStart, today]);

  /* ── Day column headers for desktop ─────────────────────────── */

  const dayHeaders = useMemo(() => {
    const start = new Date(rangeStart + 'T12:00:00');
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        label: formatDateHeader(d.toISOString().split('T')[0]),
      };
    });
  }, [rangeStart]);

  /* ── Mobile teacher cards for the selected day ──────────────── */

  const mobileDayData = useMemo(() => {
    if (!data) return [];
    return data.teachers.map((teacher) => {
      const day = teacher.days.find((d) => d.date === mobileDay) ?? null;
      return { teacher, day };
    });
  }, [data, mobileDay]);

  /* ── Detail modal data ──────────────────────────────────────── */

  const selectedDayPlanning = useMemo<DayPlanningDto | null>(() => {
    if (!selectedTeacherId || !selectedDate || !data) return null;
    const teacher = data.teachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return null;
    return teacher.days.find((d) => d.date === selectedDate) ?? null;
  }, [selectedTeacherId, selectedDate, data]);

  const selectedTeacherName = useMemo(() => {
    if (!selectedTeacherId || !data) return '';
    return data.teachers.find((t) => t.id === selectedTeacherId)?.name ?? '';
  }, [selectedTeacherId, data]);

  const hasAnyAvailability = useMemo(() => {
    if (!data) return false;
    return data.teachers.some((t) => t.days.some((d) => d.isAvailable));
  }, [data]);

  /* ── Navigators ─────────────────────────────────────────────── */

  const prevRange = () => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() - 30);
    setRangeStart(d.toISOString().split('T')[0]);
  };

  const nextRange = () => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + 30);
    setRangeStart(d.toISOString().split('T')[0]);
  };

  /* ── Skeleton loading ───────────────────────────────────────── */

  const desktopSkeleton = () => (
    <div className="overflow-x-auto">
      <div className="animate-pulse space-y-2 min-w-[900px]">
        <div className="grid grid-cols-[140px_repeat(30,minmax(44px,1fr))] gap-1.5">
          <div className="h-7 bg-surface-container-high rounded" />
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="h-7 bg-surface-container-high rounded" />
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, ri) => (
          <div key={ri} className="grid grid-cols-[140px_repeat(30,minmax(44px,1fr))] gap-1.5">
            <div className="h-10 bg-surface-container-high rounded" />
            {Array.from({ length: 30 }).map((_, ci) => (
              <div key={ci} className="h-10 bg-surface-container-high rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const mobileSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="w-11 h-14 bg-surface-container-high rounded-lg shrink-0" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-28 bg-surface-container-high rounded-xl" />
      ))}
    </div>
  );

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* ── Top navigation ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevRange}
          className="p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
          aria-label="Anterior"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRangeStart(today)}
            className="px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary-container/20 rounded-lg transition-colors cursor-pointer"
            aria-label="Hoy"
          >
            HOY
          </button>
          <button
            onClick={() => setPlanningMode((prev) => !prev)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              planningMode
                ? 'bg-primary text-white'
                : 'text-primary hover:bg-primary-container/20'
            }`}
            aria-label="Planificación Semanal"
          >
            Planificación Semanal
          </button>
          <span className="text-sm font-medium text-on-surface">{rangeLabel}</span>
        </div>
        <button
          onClick={nextRange}
          className="p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
          aria-label="Siguiente"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>

      {planningMode && data ? (
        <AdminTeacherScheduleManager
          teachers={data.teachers.map((t) => ({ id: t.id, name: t.name }))}
          initialTeacherId={data.teachers[0]?.id}
          onRefreshPlanning={refresh}
        />
      ) : (
        <>
          {/* ── Legend ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-50 border border-green-200" />
              Libre
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-yellow-50 border border-yellow-200" />
              Parcial
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-50 border border-red-200" />
              Completo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-50 border border-gray-200" />
              No disponible
            </span>
          </div>

          {/* ── Data view ─────────────────────────────────────────── */}
          <DataView
            data={data}
            isLoading={isLoading}
            error={error}
            onRetry={refresh}
            loadingComponent={
              <>
                <div className="hidden md:block">{desktopSkeleton()}</div>
                <div className="md:hidden">{mobileSkeleton()}</div>
              </>
            }
            emptyComponent={
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant">calendar_month</span>
                <p className="text-body-sm text-on-surface-variant">No hay datos disponibles</p>
              </div>
            }
          >
            {(planning) =>
              !hasAnyAvailability ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant">event_busy</span>
                  <p className="text-body-sm text-on-surface-variant">
                    Ningún profesor tiene disponibilidad en este rango
                  </p>
                </div>
              ) : (
                <>
                  {/* ══════════════════════════════════════════════════
                      DESKTOP VIEW
                      ══════════════════════════════════════════════════ */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-outline-variant/20">
                    <div className="min-w-[900px]">
                      {/* Day headers row */}
                      <div className="grid grid-cols-[140px_repeat(30,minmax(44px,1fr))]">
                        <div className="sticky left-0 z-10 bg-white py-2.5" />
                        {dayHeaders.map((h) => (
                          <div
                            key={h.date}
                            className="text-[11px] leading-tight font-medium text-on-surface-variant text-center py-2.5 px-0.5 truncate bg-white border-b border-outline-variant/20"
                          >
                            {h.label}
                          </div>
                        ))}
                      </div>

                      {/* Teacher rows */}
                      {planning.teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className="grid grid-cols-[140px_repeat(30,minmax(44px,1fr))] border-t border-outline-variant/10"
                        >
                          {/* Teacher name — sticky left */}
                          <div className="sticky left-0 z-10 bg-white flex items-center pr-2 py-3 border-r border-outline-variant/10">
                            <span className="text-sm font-medium text-on-surface truncate">
                              {teacher.name}
                            </span>
                          </div>

                          {/* Day cells */}
                          {teacher.days.slice(0, 30).map((day) => {
                            const c = getCellColors(day);
                            return (
                              <div
                                key={day.date}
                                onClick={() => {
                                  setSelectedTeacherId(teacher.id);
                                  setSelectedDate(day.date);
                                }}
                                className={`${c.bg} ${c.text} ${c.border} border-b border-r text-xs text-center py-3 px-0.5 cursor-pointer hover:opacity-80 transition-opacity`}
                                title={`${teacher.name} — ${formatDateHeader(day.date)}: ${day.bookedSlots}/${day.totalSlots}`}
                              >
                                {c.display}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ══════════════════════════════════════════════════
                      MOBILE VIEW
                      ══════════════════════════════════════════════════ */}
                  <div className="md:hidden space-y-4">
                    {/* Date selector — horizontal scroll */}
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {calendarDays.map((d) => (
                        <button
                          key={d.date}
                          onClick={() => setMobileDay(d.date)}
                          className={`shrink-0 w-11 h-14 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                            d.date === mobileDay
                              ? 'bg-primary text-white'
                              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                          } ${d.isToday && d.date !== mobileDay ? 'ring-2 ring-primary/30' : ''}`}
                        >
                          {d.day}
                        </button>
                      ))}
                    </div>

                    {mobileDayData.length === 0 ? (
                      <p className="text-sm text-on-surface-variant text-center py-4">
                        No hay datos para este día
                      </p>
                    ) : (
                      mobileDayData.map(({ teacher, day }) => {
                        const cc = getMobileCardColors(day);
                        return (
                          <Card key={teacher.id}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${cc.dot}`} />
                                <h4 className="font-medium text-on-surface text-sm">{teacher.name}</h4>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedTeacherId(teacher.id);
                                  setSelectedDate(day?.date ?? mobileDay);
                                }}
                                className="text-xs text-primary hover:text-primary/80 font-medium cursor-pointer"
                              >
                                Ver detalle
                              </button>
                            </div>

                            {!day || !day.isAvailable ? (
                              <p className="text-xs text-on-surface-variant">
                                {day?.reason ?? 'No disponible'}
                              </p>
                            ) : (
                              <>
                                <p className={`text-xs font-medium ${cc.text} mb-2`}>
                                  {day.bookedSlots} slots ocupados de {day.totalSlots}
                                </p>

                                {day.reservations.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {day.reservations.map((res) => (
                                      <div
                                        key={res.id}
                                        className="flex items-center justify-between bg-white rounded-lg p-2.5 text-xs border border-outline-variant/20"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="font-mono text-on-surface-variant shrink-0 whitespace-nowrap">
                                            {formatTime(res.startTime)}
                                          </span>
                                          <span className="font-medium text-on-surface truncate">
                                            {res.student
                                              ? `${res.student.name} ${res.student.lastName}`
                                              : '—'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                          <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                                            {getVehicleLabel(res.vehicleType)}
                                          </span>
                                          <span className="text-[10px] text-on-surface-variant">
                                            {res.duration}
                                            &apos;
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-primary">Todos los slots disponibles</p>
                                )}
                              </>
                            )}
                          </Card>
                        );
                      })
                    )}
                  </div>
                </>
              )
            }
          </DataView>

          {/* ══════════════════════════════════════════════════════════
              DETAIL MODAL
              ══════════════════════════════════════════════════════════ */}
          <Modal
            open={selectedTeacherId !== null && selectedDate !== null}
            onClose={() => {
              setSelectedTeacherId(null);
              setSelectedDate(null);
            }}
            title={
              selectedTeacherName && selectedDate
                ? `${selectedTeacherName} — ${formatDateHeader(selectedDate)}`
                : 'Detalle'
            }
          >
            {selectedDayPlanning ? (
              <div className="space-y-5">
                {/* Summary badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      !selectedDayPlanning.isAvailable
                        ? 'bg-gray-100 text-gray-500'
                        : selectedDayPlanning.freeSlots === selectedDayPlanning.totalSlots &&
                            selectedDayPlanning.totalSlots > 0
                          ? 'bg-green-50 text-green-700'
                          : selectedDayPlanning.freeSlots > 0
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {!selectedDayPlanning.isAvailable
                      ? 'No disponible'
                      : `${selectedDayPlanning.bookedSlots}/${selectedDayPlanning.totalSlots} slots`}
                  </span>
                  {selectedDayPlanning.reason && (
                    <span className="text-xs text-on-surface-variant">
                      {selectedDayPlanning.reason}
                    </span>
                  )}
                </div>

                {selectedDayPlanning.isAvailable && (
                  <>
                    {/* Reservation list */}
                    {selectedDayPlanning.reservations.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-on-surface">Reservas</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedDayPlanning.reservations.map((res: PlanningReservationDto) => (
                            <div
                              key={res.id}
                              className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg text-sm"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-mono text-on-surface-variant shrink-0">
                                  {formatTime(res.startTime)}
                                </span>
                                <span className="font-medium text-on-surface truncate">
                                  {res.student
                                    ? `${res.student.name} ${res.student.lastName}`
                                    : 'Sin alumno'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-xs text-on-surface-variant">
                                  {getVehicleLabel(res.vehicleType)}
                                </span>
                                <span className="text-xs text-on-surface-variant">
                                  {res.duration}
                                  min
                                </span>
                                <span
                                  className={`text-label-caps px-1.5 py-0.5 rounded-full font-medium ${
                                    STATUS_STYLES[res.status] ?? 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {STATUS_LABELS[res.status] ?? res.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <span className="material-symbols-outlined text-[32px] text-primary">check_circle</span>
                        <p className="text-sm text-primary font-medium">
                          No hay reservas para este día
                        </p>
                      </div>
                    )}

                    {/* Available slots */}
                    {selectedDayPlanning.freeSlots > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-700">
                          {selectedDayPlanning.freeSlots} slot
                          {selectedDayPlanning.freeSlots !== 1 ? 's' : ''} disponible
                          {selectedDayPlanning.freeSlots !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {!selectedDayPlanning.isAvailable && selectedDayPlanning.reason && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">{selectedDayPlanning.reason}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-4">
                No hay información disponible para esta selección
              </p>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
