'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refresh: fetch };
}
