export const VEHICLE_TYPES = ['moto-pista', 'moto-circulacion', 'coche-manual', 'coche-automatico'] as const;
export type VehicleType = typeof VEHICLE_TYPES[number];
