'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { ReservationDto, VehicleTypeConfigDto, SlotRangeResultDto } from '@/services/interfaces';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function getMonthYear(date: Date): string {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const TODAY = new Date().toISOString().split('T')[0];

export default function StudentCalendar() {
  const { user } = useAuth();
  const studentId = user?.studentId;
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('coche-manual');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'validating' | 'done' | 'error'>('idle');
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState<string>(TODAY);

  // Load student profile to get teacherId
  const { data: studentProfile } = useData(
    async () => studentId ? services.student.getProfile(studentId) : null,
    [studentId],
  );

  // Load vehicle types
  const { data: vehicleTypes } = useData<VehicleTypeConfigDto[]>(
    () => services.scheduling.getVehicleTypeConfig(),
    [],
  );

  // Load 30-day slot range
  const { data: rangeData, isLoading: rangeLoading, refresh: refreshRange } = useData<SlotRangeResultDto | null>(
    async () => {
      if (!teacherId) return null;
      return services.scheduling.getSlotsRange(teacherId, rangeStart, selectedVehicleType, 30);
    },
    [teacherId, rangeStart, selectedVehicleType],
  );

  // Load existing reservations
  const { data: reservations, refresh: refreshReservations } = useData<ReservationDto[]>(
    async () => {
      const result = await services.reservation.list({ studentId: studentId ?? undefined });
      return result.data;
    },
    [studentId],
  );

  useEffect(() => {
    if (studentProfile && 'teacherId' in studentProfile) {
      const tid = (studentProfile as unknown as { teacherId: string | null }).teacherId;
      if (tid) setTeacherId(tid);
    }
  }, [studentProfile]);

  // Build set of dates that have slots
  const datesWithSlots = useMemo(() => {
    const set = new Set<string>();
    if (rangeData?.days) {
      for (const day of rangeData.days) {
        if (day.slots.length > 0) set.add(day.date);
      }
    }
    return set;
  }, [rangeData]);

  // Build 30-day calendar days array
  const calendarDays = useMemo(() => {
    const start = new Date(rangeStart);
    const days: Array<{ date: string; day: number; dayOfWeek: number; isToday: boolean }> = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        day: d.getDate(),
        dayOfWeek: d.getDay(),
        isToday: dateStr === TODAY,
      });
    }
    return days;
  }, [rangeStart]);

  // Load remaining classes
  const { data: balance, refresh: refreshBalance } = useData<Pick<import('@/services/interfaces').StudentDto, 'remainingClasses' | 'balanceHistory'>>(
    async () => {
      if (!studentId) return { remainingClasses: 0, balanceHistory: [] } as Pick<import('@/services/interfaces').StudentDto, 'remainingClasses' | 'balanceHistory'>;
      return services.student.getBalance(studentId);
    },
    [studentId],
  );

  const noRemainingClasses = balance && balance.remainingClasses <= 0;

  // Get slots for the selected date from the range data
  const selectedDaySlots = useMemo(() => {
    if (!rangeData?.days) return [];
    const day = rangeData.days.find(d => d.date === selectedDate);
    return day?.slots ?? [];
  }, [rangeData, selectedDate]);

  const slotDuration = useMemo(() => {
    if (!rangeData?.days) return 45;
    const day = rangeData.days.find(d => d.date === selectedDate);
    return day?.slotDuration ?? 45;
  }, [rangeData, selectedDate]);

  const bookSlot = async () => {
    if (!selectedSlot || !teacherId || !studentId) return;
    setBookingStatus('validating');
    setBookingMessage(null);
    try {
      const duration = vehicleTypes?.find(v => v.type === selectedVehicleType)?.duration ?? 45;
      const validation = await services.scheduling.validateSlot(teacherId, studentId, selectedVehicleType, selectedSlot, duration);
      if (!validation.valid) {
        setBookingStatus('error');
        setBookingMessage(validation.reason);
        return;
      }
      setBookingStatus('loading');
      await services.reservation.create({
        studentId, teacherId, vehicleType: selectedVehicleType, startTime: selectedSlot, duration,
      });
      setBookingStatus('done');
      setBookingMessage('¡Clase reservada con éxito!');
      setSelectedSlot(null);
      refreshRange();
      refreshReservations();
      refreshBalance();
    } catch (err) {
      setBookingStatus('error');
      setBookingMessage(err instanceof Error ? err.message : 'Error al reservar');
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!window.confirm('¿Estás seguro de cancelar esta clase?')) return;
    setCancellingId(reservationId);
    setCancelError(null);
    try {
      await services.reservation.cancel(reservationId);
      refreshReservations();
      refreshBalance();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setCancellingId(null);
    }
  };

  const prevRange = () => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() - 30);
    setRangeStart(d.toISOString().split('T')[0]);
    setSelectedSlot(null);
    setBookingStatus('idle');
    setBookingMessage(null);
  };

  const nextRange = () => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + 30);
    setRangeStart(d.toISOString().split('T')[0]);
    setSelectedSlot(null);
    setBookingStatus('idle');
    setBookingMessage(null);
  };

  // Build grid cells with empty padding to align with Mon start
  const gridCells = useMemo(() => {
    const cells: Array<{ type: 'day'; date: string; day: number; isToday: boolean } | { type: 'empty' }> = [];
    if (calendarDays.length === 0) return cells;

    const firstDow = calendarDays[0].dayOfWeek === 0 ? 7 : calendarDays[0].dayOfWeek;
    for (let i = 1; i < firstDow; i++) {
      cells.push({ type: 'empty' });
    }
    for (const d of calendarDays) {
      cells.push({ type: 'day', date: d.date, day: d.day, isToday: d.isToday });
    }
    return cells;
  }, [calendarDays]);

  // Group cells into rows of 7
  const gridRows = useMemo(() => {
    const rows: typeof gridCells[] = [];
    for (let i = 0; i < gridCells.length; i += 7) {
      rows.push(gridCells.slice(i, i + 7));
    }
    return rows;
  }, [gridCells]);

  return (
    <div className="space-y-6">
      {/* Header: month + remaining classes */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-title-md font-bold text-on-surface">
            {getMonthYear(new Date(rangeStart))}
          </h2>
          {balance != null && (
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              <span className={`font-semibold ${noRemainingClasses ? 'text-error' : 'text-primary'}`}>
                {balance.remainingClasses}
              </span> clases restantes
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevRange} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            onClick={() => { setRangeStart(TODAY); setSelectedSlot(null); setBookingStatus('idle'); }}
            className="px-2 py-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <button onClick={nextRange} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Vehicle type selector */}
      <Card>
        <CardHeader title="Tipo de clase" />
        <DataView data={vehicleTypes} isLoading={false} error={null}>
          {(types) => (
            <div className="grid grid-cols-2 gap-2">
              {types.map((vt) => (
                <button key={vt.id} onClick={() => setSelectedVehicleType(vt.type)}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                    selectedVehicleType === vt.type
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-on-surface border-outline-variant/30 hover:border-primary/50'
                  }`}>
                  <p className="capitalize">{vt.type.replace('-', ' ')}</p>
                  <p className="text-xs opacity-70">{vt.duration} min</p>
                </button>
              ))}
            </div>
          )}
        </DataView>
      </Card>

      {/* 30-day Calendar Grid */}
      <Card accent>
        <CardHeader title="Selecciona un día" />
        {!teacherId ? (
          <p className="text-body-sm text-on-surface-variant text-center py-8">
            No tienes un profesor asignado. Contacta con la administración.
          </p>
        ) : rangeLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface-container-low rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Day name headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((name) => (
                <div key={name} className="text-center text-label-caps text-on-surface-variant py-1">
                  {name}
                </div>
              ))}
            </div>
            {/* Calendar rows */}
            {gridRows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-1">
                {row.map((cell, ci) =>
                  cell.type === 'empty' ? (
                    <div key={`e-${ri}-${ci}`} />
                  ) : (
                    <button key={cell.date} onClick={() => { setSelectedDate(cell.date); setSelectedSlot(null); setBookingStatus('idle'); setBookingMessage(null); }}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-colors relative cursor-pointer ${
                        cell.date === selectedDate
                          ? 'bg-primary text-white'
                          : 'hover:bg-surface-container-low text-on-surface'
                      }`}>
                      <span className={`text-xs sm:text-sm font-medium ${cell.isToday && cell.date !== selectedDate ? 'text-primary' : cell.date === selectedDate ? 'text-white' : ''}`}>
                        {cell.day}
                      </span>
                      {datesWithSlots.has(cell.date) && cell.date !== selectedDate && (
                        <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                      )}
                      {cell.isToday && cell.date !== selectedDate && (
                        <span className="absolute inset-0 border border-primary/40 rounded-lg pointer-events-none" />
                      )}
                    </button>
                  )
                )}
              </div>
            ))}
            {/* Range info */}
            <p className="text-xs text-on-surface-variant text-center mt-3">
              Mostrando 30 días desde el {new Date(rangeStart).toLocaleDateString('es-ES')}
            </p>
          </>
        )}
      </Card>

      {/* Selected day slots + booking */}
      {teacherId && selectedDate && (
        <Card>
          <CardHeader
            title={new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            action={
              <button onClick={refreshRange} className="text-xs text-primary hover:text-primary/80 cursor-pointer">
                Actualizar
              </button>
            }
          />
          {balance === null ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 mx-auto bg-surface-container-low rounded-full animate-pulse" />
            </div>
          ) : noRemainingClasses ? (
            <div className="text-center py-8 space-y-3">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant block">block</span>
              <p className="text-body-sm text-on-surface-variant">
                No tienes clases disponibles. Compra un pack para poder reservar.
              </p>
            </div>
          ) : selectedDaySlots.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant text-center py-8">
              No hay horarios disponibles para esta fecha
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedDaySlots.map((slot) => (
                  <button key={slot} onClick={() => setSelectedSlot(selectedSlot === slot ? null : slot)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                      selectedSlot === slot
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-on-surface border-outline-variant/30 hover:border-primary/50'
                    }`}>
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
              {selectedSlot && (
                <div className="mt-4">
                  <button onClick={bookSlot}
                    disabled={bookingStatus === 'loading' || bookingStatus === 'validating'}
                    className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer">
                    {bookingStatus === 'validating' ? 'Validando con IA...' :
                     bookingStatus === 'loading' ? 'Reservando...' :
                     `Reservar clase (${formatTime(selectedSlot)} · ${slotDuration} min)`}
                  </button>
                  {bookingMessage && (
                    <p className={`text-sm mt-2 text-center ${bookingStatus === 'done' ? 'text-primary' : 'text-error'}`}>
                      {bookingMessage}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Existing Reservations */}
      <Card>
        <CardHeader title="Mis reservas" />
        {cancelError && (
          <div className="mx-3 mb-2 p-3 bg-error-container text-error rounded-lg text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {cancelError}
          </div>
        )}
        <DataView
          data={reservations}
          isLoading={false}
          error={null}
          emptyComponent={
            <p className="text-body-sm text-on-surface-variant text-center py-4">No tienes reservas</p>
          }>
          {(res) => (
            <div className="space-y-2">
              {res.filter(r => r.status !== 'completed').map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 p-3 bg-surface-container-low rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {new Date(r.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {formatTime(r.startTime)} · {r.vehicleType === 'car' ? 'Coche' : 'Moto'} · {r.duration} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-label-caps px-2 py-1 rounded-full font-semibold ${
                      r.status === 'confirmed' ? 'bg-primary-container text-primary' :
                      r.status === 'pending' ? 'bg-surface-container-high text-tertiary' :
                      'bg-surface-container text-on-surface-variant'
                    }`}>
                      {r.status === 'confirmed' ? 'Confirmada' :
                       r.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                    </span>
                    {(r.status === 'confirmed' || r.status === 'pending') && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={cancellingId === r.id}
                        className="text-xs text-error hover:text-error/80 disabled:opacity-50 p-1 cursor-pointer"
                        title="Cancelar clase"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {cancellingId === r.id ? 'hourglass_top' : 'close'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataView>
      </Card>
    </div>
  );
}
