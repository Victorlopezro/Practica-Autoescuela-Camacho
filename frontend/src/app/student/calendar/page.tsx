'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { ReservationDto, VehicleTypeConfigDto } from '@/services/interfaces';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function getWeekDays() {
  const now = new Date();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return { day: dayNames[d.getDay()], date: d.getDate(), fullDate: d };
  });
}

function getMonthName(): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

export default function StudentCalendar() {
  const { user } = useAuth();
  const studentId = user?.studentId;
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('coche-manual');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'validating' | 'done' | 'error'>('idle');
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  // Load teacher info for this student
  const { data: studentProfile } = useData(
    async () => {
      if (!studentId) return null;
      return services.student.getProfile(studentId);
    },
    [studentId],
  );

  // Load vehicle types
  const { data: vehicleTypes } = useData<VehicleTypeConfigDto[]>(
    () => services.scheduling.getVehicleTypeConfig(),
    [],
  );

  // Load available slots
  const { data: slotsData, isLoading: slotsLoading, refresh: refreshSlots } = useData(
    async () => {
      if (!teacherId) return null;
      return services.scheduling.getSlots(teacherId, selectedDate, selectedVehicleType);
    },
    [teacherId, selectedDate, selectedVehicleType],
  );

  // Load existing reservations for this student
  const { data: reservations, refresh: refreshReservations } = useData<ReservationDto[]>(
    async () => {
      const result = await services.reservation.list({ studentId: studentId ?? undefined });
      return result.data;
    },
    [studentId],
  );

  // Once we have student profile, determine teacherId
  useEffect(() => {
    if (studentProfile && 'teacherId' in studentProfile && (studentProfile as unknown as { teacherId: string | null }).teacherId) {
      setTeacherId((studentProfile as unknown as { teacherId: string }).teacherId);
    }
  }, [studentProfile]);

  const bookSlot = async () => {
    if (!selectedSlot || !teacherId || !studentId) return;

    setBookingStatus('validating');
    setBookingMessage(null);

    try {
      // Step 1: AI validation
      const duration = vehicleTypes?.find((v) => v.type === selectedVehicleType)?.duration ?? 45;
      const validation = await services.scheduling.validateSlot(
        teacherId,
        studentId,
        selectedVehicleType,
        selectedSlot,
        duration,
      );

      if (!validation.valid) {
        setBookingStatus('error');
        setBookingMessage(validation.reason);
        return;
      }

      // Step 2: Create reservation
      setBookingStatus('loading');
      await services.reservation.create({
        studentId,
        teacherId,
        vehicleType: selectedVehicleType,
        startTime: selectedSlot,
        duration,
      });

      setBookingStatus('done');
      setBookingMessage('¡Clase reservada con éxito!');
      setSelectedSlot(null);
      refreshSlots();
      refreshReservations();
    } catch (err) {
      setBookingStatus('error');
      setBookingMessage(err instanceof Error ? err.message : 'Error al reservar');
    }
  };

  const weekDays = getWeekDays();
  const slots = slotsData?.slots ?? [];

  return (
    <div className="space-y-6">
      {/* Week View — existing */}
      <Card>
        <CardHeader title={getMonthName()} />
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((d) => {
            const dateStr = d.fullDate.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDate(dateStr)}
                className={`py-1.5 px-0.5 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <p className="text-[10px] sm:text-label-caps text-on-surface-variant">{d.day}</p>
                <p className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-on-surface'}`}>
                  {d.date}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Vehicle Type Selector */}
      <Card>
        <CardHeader title="Tipo de clase" />
        <DataView
          data={vehicleTypes}
          isLoading={false}
          error={null}
        >
          {(types) => (
            <div className="grid grid-cols-2 gap-2">
              {types.map((vt) => (
                <button
                  key={vt.id}
                  onClick={() => setSelectedVehicleType(vt.type)}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                    selectedVehicleType === vt.type
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-on-surface border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  <p>{vt.type.replace('-', ' ')}</p>
                  <p className="text-xs opacity-70">{vt.duration} min</p>
                </button>
              ))}
            </div>
          )}
        </DataView>
      </Card>

      {/* Available Slots */}
      <Card accent>
        <CardHeader
          title="Horarios disponibles"
          subtitle={new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          action={
            <button
              onClick={refreshSlots}
              className="text-xs text-primary hover:text-primary/80"
            >
              Actualizar
            </button>
          }
        />
        {!teacherId ? (
          <p className="text-body-sm text-on-surface-variant text-center py-8">
            No tienes un profesor asignado. Contacta con la administración.
          </p>
        ) : slotsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-surface-container-low rounded-lg animate-pulse" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant text-center py-8">
            No hay horarios disponibles para esta fecha
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot) => {
              const isSelected = slot === selectedSlot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(isSelected ? null : slot)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                    isSelected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-on-surface border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  {formatTime(slot)}
                </button>
              );
            })}
          </div>
        )}

        {/* Book button */}
        {selectedSlot && (
          <div className="mt-4">
            <button
              onClick={bookSlot}
              disabled={bookingStatus === 'loading' || bookingStatus === 'validating'}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {bookingStatus === 'validating' ? 'Validando con IA...' :
               bookingStatus === 'loading' ? 'Reservando...' :
               'Reservar clase'}
            </button>
            {bookingMessage && (
              <p className={`text-sm mt-2 text-center ${
                bookingStatus === 'done' ? 'text-primary' : 'text-error'
              }`}>
                {bookingMessage}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Existing Reservations */}
      <Card>
        <CardHeader title="Mis reservas" />
        <DataView
          data={reservations}
          isLoading={false}
          error={null}
          emptyComponent={
            <p className="text-body-sm text-on-surface-variant text-center py-4">No tienes reservas</p>
          }
        >
          {(res) => (
            <div className="space-y-2">
              {res.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 p-3 bg-surface-container-low rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {new Date(r.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {formatTime(r.startTime)} · {r.vehicleType} · {r.duration} min
                    </p>
                  </div>
                  <span className={`text-label-caps px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                    r.status === 'confirmed' ? 'bg-primary-container text-primary' :
                    r.status === 'completed' ? 'bg-surface-container text-on-surface-variant' :
                    'bg-surface-container-high text-tertiary'
                  }`}>
                    {r.status === 'confirmed' ? 'Confirmada' :
                     r.status === 'completed' ? 'Completada' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DataView>
      </Card>
    </div>
  );
}
