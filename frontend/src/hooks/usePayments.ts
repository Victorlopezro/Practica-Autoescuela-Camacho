/**
 * usePayments Hook
 *
 * PLACEHOLDER — Hook for fetching payment history and billing info.
 * FUTURE STRIPE: Replace mock data with Stripe API calls via the
 * paymentService. Add real-time subscription status, invoice preview.
 *
 * Usage:
 *   const { transactions, summary, loading, error } = usePayments(userId);
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  PaymentTransaction,
  BillingSummary,
} from '@/types/payment';
import { paymentService } from '@/services/payments';

interface UsePaymentsResult {
  /** List of payment transactions, newest first */
  transactions: PaymentTransaction[];
  /** Aggregated billing summary */
  summary: BillingSummary | null;
  /** Whether data is being fetched */
  loading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Manual refresh */
  refresh: () => Promise<void>;
}

export function usePayments(userId: string | undefined): UsePaymentsResult {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const [history, billing] = await Promise.all([
        paymentService.getPaymentHistory(userId),
        paymentService.getBillingSummary(userId),
      ]);

      setTransactions(history);
      setSummary(billing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // React 19 desaconseja llamar setState sincrónicamente dentro de effects.
  // queueMicrotask asegura que fetchData (y sus setState internos) corran
  // en un microtask posterior, no sincrónicamente en el effect body.
  useEffect(() => {
    queueMicrotask(() => fetchData());
  }, [fetchData]);

  return {
    transactions,
    summary,
    loading,
    error,
    refresh: fetchData,
  };
}
