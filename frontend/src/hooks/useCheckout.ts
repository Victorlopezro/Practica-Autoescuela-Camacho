/**
 * useCheckout Hook
 *
 * Manages the checkout flow state machine:
 *   idle → loading → confirm → processing → success | error
 *
 * PLACEHOLDER: Uses mock paymentService. FUTURE STRIPE:
 *   1. Replace createCheckout with Stripe Checkout Session
 *   2. Confirm with stripe.confirmPayment()
 *   3. Handle 3D Secure / SCA via Stripe PaymentElement
 *
 * @see https://stripe.com/docs/payments/accept-a-payment
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  CheckoutItem,
  CheckoutState,
  PaymentTransaction,
  PaymentError,
} from '@/types/payment';
import { paymentService } from '@/services/payments';

export type CheckoutPhase =
  | 'idle'
  | 'loading'
  | 'confirm'
  | 'processing'
  | 'success'
  | 'error';

interface UseCheckoutResult {
  phase: CheckoutPhase;
  checkoutState: CheckoutState | null;
  transaction: PaymentTransaction | null;
  error: PaymentError | null;
  checkoutId: string | null;
  /** Start checkout with selected items */
  initiateCheckout: (items: CheckoutItem[]) => Promise<void>;
  /** Confirm and process the payment */
  confirmPayment: () => Promise<void>;
  /** Reset to idle state */
  reset: () => void;
}

export function useCheckout(): UseCheckoutResult {
  const [phase, setPhase] = useState<CheckoutPhase>('idle');
  const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(null);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<PaymentError | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const initiateCheckout = useCallback(async (items: CheckoutItem[]) => {
    setPhase('loading');
    setError(null);

    try {
      const result = await paymentService.createCheckout(items);
      setCheckoutState(result.state);
      setCheckoutId(result.checkoutId);
      setPhase('confirm');
    } catch (err) {
      setError({
        code: 'checkout_error',
        message: err instanceof Error ? err.message : 'Error al iniciar el pago',
        recoverable: true,
      });
      setPhase('error');
    }
  }, []);

  const confirmPayment = useCallback(async () => {
    if (!checkoutId) return;

    setPhase('processing');
    setError(null);

    // FUTURE STRIPE:
    //   const { error } = await stripe.confirmPayment({
    //     elements,
    //     clientSecret: checkoutState?.stripeClientSecret,
    //     confirmParams: { return_url: `${window.location.origin}/payment/success` },
    //   });

    const result = await paymentService.processPayment(checkoutId);

    if (result.success && result.transaction) {
      setTransaction(result.transaction);
      setPhase('success');
    } else if (result.error) {
      setError(result.error);
      setPhase('error');
    }
  }, [checkoutId]);

  const reset = useCallback(() => {
    setPhase('idle');
    setCheckoutState(null);
    setTransaction(null);
    setError(null);
    setCheckoutId(null);
  }, []);

  return {
    phase,
    checkoutState,
    transaction,
    error,
    checkoutId,
    initiateCheckout,
    confirmPayment,
    reset,
  };
}
