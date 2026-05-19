import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useData } from './useData';

describe('useData', () => {
  it('should return loading state initially', () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useData(fetcher, []));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set data after successful fetch', async () => {
    const fetcher = vi.fn().mockResolvedValue('hello');
    const { result } = renderHook(() => useData(fetcher, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBe('hello');
    expect(result.current.error).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should set error when fetcher throws', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useData(fetcher, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('should re-fetch when deps change', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    const { result, rerender } = renderHook(
      ({ id }) => useData(() => fetcher(id), [id]),
      { initialProps: { id: 1 } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher).toHaveBeenCalledWith(1);

    rerender({ id: 2 });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher).toHaveBeenCalledWith(2);
  });

  it('should set generic error message when fetcher throws non-Error', async () => {
    const fetcher = vi.fn().mockRejectedValue('string error');
    const { result } = renderHook(() => useData(fetcher, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Error al cargar datos');
  });

  it('should re-fetch when refresh is called', async () => {
    let callCount = 0;
    const fetcher = vi.fn().mockImplementation(async () => {
      callCount++;
      return `data-${callCount}`;
    });

    const { result } = renderHook(() => useData(fetcher, []));

    await waitFor(() => expect(result.current.data).toBe('data-1'));

    result.current.refresh();

    await waitFor(() => expect(result.current.data).toBe('data-2'));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
