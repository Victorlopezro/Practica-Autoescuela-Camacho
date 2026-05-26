'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/shared/Modal';
import { services } from '@/services';
import type { TeacherDto } from '@/services/interfaces';
import type { VehicleTypeConfigDto } from '@/services/interfaces';
import type { StudentWithUserDto, StudentDto } from '@/services/interfaces';

interface CreateReservationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'form' | 'loading' | 'no-slots' | 'error';

export function CreateReservationModal({ open, onClose, onSuccess }: CreateReservationModalProps) {
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeConfigDto[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherId, setTeacherId] = useState('');
  const [date, setDate] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  // Slots
  const [slots, setSlots] = useState<string[]>([]);
  const [slotDuration, setSlotDuration] = useState(45);
  const [doubleSession, setDoubleSession] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');

  // Student search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StudentWithUserDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithUserDto | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentDto | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Create
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load teachers and vehicle types on mount
  useEffect(() => {
    if (!open) return;

    setLoadingTeachers(true);
    setStep('form');
    setErrorMessage(null);
    setSelectedSlot(null);
    setSelectedStudent(null);
    setStudentProfile(null);
    setSearchTerm('');
    setSearchResults([]);
    setSlots([]);
    setTeacherId('');
    setDate('');
    setVehicleType('');

    Promise.all([
      services.teacher.list(),
      services.scheduling.getVehicleTypeConfig(),
    ])
      .then(([t, v]) => {
        setTeachers(t);
        setVehicleTypes(v);
      })
      .catch(() => {
        setErrorMessage('Error al cargar datos iniciales');
      })
      .finally(() => {
        setLoadingTeachers(false);
      });
  }, [open]);

  // Load slots when teacher, date, or vehicle type changes
  useEffect(() => {
    if (!teacherId || !date || !vehicleType) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    setLoadingSlots(true);
    setStep('form');
    setErrorMessage(null);
    setSelectedSlot(null);

    services.scheduling
      .getSlots(teacherId, date, vehicleType)
      .then((result) => {
        setSlots(result.slots);
        setSlotDuration(result.slotDuration);
        setDoubleSession(result.doubleSession);
        if (result.slots.length === 0) {
          setStep('no-slots');
        }
      })
      .catch(() => {
        setErrorMessage('Error al cargar slots');
        setStep('error');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [teacherId, date, vehicleType]);

  // Student search debounce 300ms
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      services.student
        .list(1, 10, searchTerm)
        .then((result) => {
          setSearchResults(result.data);
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load student profile when selected
  const handleSelectStudent = useCallback(async (student: StudentWithUserDto) => {
    setSelectedStudent(student);
    setLoadingProfile(true);
    setErrorMessage(null);
    try {
      const profile = await services.student.getProfile(student.id);
      setStudentProfile(profile);
    } catch {
      setErrorMessage('Error al cargar perfil del alumno');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const canReserve = (): boolean => {
    if (!studentProfile) return false;
    if (doubleSession) return studentProfile.remainingClasses > 1;
    return studentProfile.remainingClasses > 0;
  };

  const getReserveError = (): string | null => {
    if (!studentProfile) return null;
    if (doubleSession && studentProfile.remainingClasses <= 1) {
      return `Se necesitan al menos 2 clases para una sesión doble (tienes ${studentProfile.remainingClasses})`;
    }
    if (studentProfile.remainingClasses <= 0) {
      return 'No tienes clases disponibles';
    }
    return null;
  };

  const handleCreate = async () => {
    if (!selectedStudent || !selectedSlot || !teacherId || !vehicleType) return;

    // Client-side validation
    if (!canReserve()) {
      setErrorMessage(getReserveError());
      return;
    }

    setCreating(true);
    setErrorMessage(null);

    try {
      await services.reservation.create({
        studentId: selectedStudent.id,
        teacherId,
        vehicleType,
        startTime: selectedSlot,
        duration: slotDuration,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al crear la reserva');
      setStep('error');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const isReserveDisabled =
    !canReserve() ||
    !selectedSlot ||
    !teacherId ||
    !vehicleType ||
    !selectedStudent ||
    creating;

  const reserveLabel = creating
    ? 'Reservando...'
    : selectedStudent
      ? `Reservar para ${selectedStudent.user?.name || 'Alumno'}`
      : 'Reservar';

  return (
    <Modal open={open} onClose={handleClose} title="Nueva Reserva" className="w-[36rem]">
      <div className="space-y-4">
        {/* Profesor */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Profesor</label>
          <select
            value={teacherId}
            onChange={(e) => {
              setTeacherId(e.target.value);
              setSelectedSlot(null);
            }}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loadingTeachers || creating}
          >
            <option value="">
              {loadingTeachers ? 'Cargando profesores...' : 'Seleccionar profesor'}
            </option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(null);
            }}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={creating}
          />
        </div>

        {/* Tipo de vehículo */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Tipo de vehículo</label>
          <select
            value={vehicleType}
            onChange={(e) => {
              setVehicleType(e.target.value);
              setSelectedSlot(null);
            }}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={creating}
          >
            <option value="">Seleccionar tipo</option>
            {vehicleTypes.map((vt) => (
              <option key={vt.id} value={vt.type}>
                {vt.type} ({vt.duration}min)
              </option>
            ))}
          </select>
        </div>

        {/* Slots disponibles */}
        {teacherId && date && vehicleType && (
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Horario disponible</label>
            {loadingSlots ? (
              <p className="text-sm text-on-surface-variant">Cargando slots...</p>
            ) : step === 'no-slots' ? (
              <p className="text-sm text-error">No hay slots disponibles</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const time = slot.substring(11, 16);
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(isSelected ? null : slot)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                      type="button"
                      disabled={creating}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Búsqueda de alumno */}
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">Alumno</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedStudent(null);
              setStudentProfile(null);
            }}
            placeholder="Buscar alumno..."
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={creating}
          />
          {searching && <p className="text-xs text-on-surface-variant mt-1">Buscando...</p>}

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && !selectedStudent && (
            <div className="mt-2 border border-outline-variant/30 rounded-lg overflow-hidden">
              {searchResults.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-container-low transition-colors text-sm cursor-pointer border-b border-outline-variant/10 last:border-b-0"
                  type="button"
                >
                  <span className="font-medium text-on-surface">
                    {s.user?.name} {s.user?.lastName}
                  </span>
                  <span className="text-on-surface-variant ml-2">@{s.user?.username}</span>
                </button>
              ))}
            </div>
          )}

          {searchTerm && !searching && searchResults.length === 0 && !selectedStudent && (
            <p className="text-xs text-on-surface-variant mt-1">No se encontraron alumnos</p>
          )}
        </div>

        {/* Alumno seleccionado */}
        {selectedStudent && (
          <div className="p-3 bg-surface-container-low rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">
                  {selectedStudent.user?.name} {selectedStudent.user?.lastName}
                </p>
                <p className="text-xs text-on-surface-variant">@{selectedStudent.user?.username}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentProfile(null);
                }}
                className="text-xs text-error hover:underline cursor-pointer"
                type="button"
                disabled={creating}
              >
                Cambiar
              </button>
            </div>
            {loadingProfile ? (
              <p className="text-xs text-on-surface-variant mt-1">Cargando perfil...</p>
            ) : studentProfile ? (
              <div className="mt-2">
                <p className="text-sm">
                  <span className="text-on-surface-variant">Clases restantes: </span>
                  <span
                    className={`font-semibold ${
                      studentProfile.remainingClasses > 0 ? 'text-primary' : 'text-error'
                    }`}
                  >
                    {studentProfile.remainingClasses}
                  </span>
                </p>
                {doubleSession && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    Sesión doble: requiere al menos 2 clases
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Error inline */}
        {errorMessage && (
          <div className="p-3 bg-error-container text-error rounded-lg text-sm">{errorMessage}</div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            type="button"
            disabled={creating}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={isReserveDisabled}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            type="button"
          >
            {reserveLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
