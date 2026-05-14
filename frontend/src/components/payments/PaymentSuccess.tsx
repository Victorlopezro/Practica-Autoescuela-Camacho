/**
 * PaymentSuccess
 *
 * Shown after a successful payment. Displays the transaction details
 * and provides navigation options back to the app.
 *
 * FUTURE STRIPE: Will show the Stripe-hosted receipt URL and
 * allow downloading the invoice.
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { PaymentTransaction } from '@/types/payment';

interface PaymentSuccessProps {
  transaction: PaymentTransaction;
  className?: string;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function PaymentSuccess({ transaction, className }: PaymentSuccessProps) {
  return (
    <div
      className={cn(
        'max-w-md mx-auto text-center',
        className
      )}
    >
      {/* Success animation placeholder */}
      <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
        <span className="material-symbols-outlined text-primary text-[40px]">
          check
        </span>
      </div>

      <h2 className="text-headline-md font-bold text-on-surface mb-2">
        ¡Pago realizado con éxito!
      </h2>
      <p className="text-body-sm text-on-surface-variant mb-8">
        Tu transacción se ha completado correctamente.
        Recibirás un correo con los detalles.
      </p>

      {/* Transaction Details */}
      <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-left mb-8">
        <div className="space-y-3">
          <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">Concepto</span>
            <span className="font-medium text-on-surface">{transaction.concept}</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">Importe</span>
            <span className="font-bold text-on-surface">
              {fmt(transaction.amount)}
            </span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">ID</span>
            <span className="font-mono text-xs text-on-surface-variant">
              {transaction.id}
            </span>
          </div>
        </div>

        {/* FUTURE STRIPE: Receipt link */}
        {/* {transaction.receiptUrl && (
          <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer"
             className="mt-4 block text-center text-primary font-semibold text-label-caps hover:underline">
            Ver recibo
          </a>
        )} */}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link
          href="/student/dashboard"
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-center hover:bg-primary/90 transition-colors"
        >
          Ir al inicio
        </Link>
        <Link
          href="/student/billing"
          className="w-full bg-white border border-outline-variant/30 text-on-surface-variant py-3 rounded-xl font-medium text-center hover:bg-surface-container transition-colors"
        >
          Ver historial de pagos
        </Link>
      </div>
    </div>
  );
}
