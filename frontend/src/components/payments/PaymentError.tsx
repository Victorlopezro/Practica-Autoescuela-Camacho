/**
 * PaymentError
 *
 * Displays payment error information and provides recovery actions.
 *
 * FUTURE STRIPE: Will show Stripe-specific error messages and
 * decline codes (card_declined, insufficient_funds, etc.).
 *
 * @see https://stripe.com/docs/declines/codes
 */

'use client';

import { cn } from '@/lib/utils';
import type { PaymentError as PaymentErrorType } from '@/types/payment';

interface PaymentErrorDisplayProps {
  error: PaymentErrorType;
  /** Called when user wants to retry */
  onRetry?: () => void;
  /** Called when user wants to go back */
  onBack?: () => void;
  className?: string;
}

export function PaymentErrorDisplay({
  error,
  onRetry,
  onBack,
  className,
}: PaymentErrorDisplayProps) {
  return (
    <div className={cn('max-w-md mx-auto text-center', className)}>
      {/* Error icon */}
      <div className="w-20 h-20 bg-error-container rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
        <span className="material-symbols-outlined text-error text-[40px]">
          error_outline
        </span>
      </div>

      <h2 className="text-headline-md font-bold text-on-surface mb-2">
        Error en el pago
      </h2>
      <p className="text-body-sm text-on-surface-variant mb-2">
        {error.message}
      </p>

      {/* Stripe-specific error details (future) */}
      {error.stripeErrorType && (
        <p className="text-label-caps text-on-surface-variant/60 mb-8">
          Tipo: {error.stripeErrorType}
        </p>
      )}

      <div className="text-left">
        <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] mb-8">
          <h4 className="text-label-caps font-semibold text-on-surface-variant uppercase mb-2">
            Posibles causas
          </h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-outline mt-0.5">circle</span>
              Fondos insuficientes en la tarjeta
            </li>
            <li className="flex items-start gap-2 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-outline mt-0.5">circle</span>
              Datos de tarjeta incorrectos
            </li>
            <li className="flex items-start gap-2 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-outline mt-0.5">circle</span>
              Bloqueo temporal por el banco emisor
            </li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {error.recoverable && onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Intentar de nuevo
          </button>
        )}
        {onBack && (
          <button
            onClick={onBack}
            className="w-full bg-white border border-outline-variant/30 text-on-surface-variant py-3 rounded-xl font-medium hover:bg-surface-container transition-colors cursor-pointer"
          >
            Volver atrás
          </button>
        )}
      </div>
    </div>
  );
}
