'use client';

import type { ReactNode } from 'react';

interface DataViewProps<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  children: (data: T) => ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: (error: string, retry: () => void) => ReactNode;
  emptyComponent?: ReactNode;
  onRetry?: () => void;
}

export function DataView<T>({
  data,
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
}: DataViewProps<T>) {
  if (isLoading) {
    return loadingComponent ?? (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-on-surface-variant">Cargando...</div>
      </div>
    );
  }

  if (error) {
    if (errorComponent) return errorComponent(error, onRetry ?? (() => {}));
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-error text-body-sm">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent ?? (
      <div className="flex items-center justify-center p-8 text-on-surface-variant">
        No hay datos disponibles
      </div>
    );
  }

  return <>{children(data)}</>;
}
