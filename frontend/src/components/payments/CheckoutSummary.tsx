/**
 * CheckoutSummary
 *
 * Displays the checkout order summary with line items, subtotal, and total.
 * Used in the /checkout page to show the user what they're paying for.
 *
 * FUTURE STRIPE: Will show Stripe-formatted prices and any applied coupons.
 */

'use client';

import { cn } from '@/lib/utils';
import type { CheckoutState } from '@/types/payment';

interface CheckoutSummaryProps {
  state: CheckoutState;
  className?: string;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function CheckoutSummary({ state, className }: CheckoutSummaryProps) {
  const { items, subtotal, discount, total } = state;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-outline-variant/30 p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]',
        className
      )}
    >
      <h3 className="font-semibold text-on-surface mb-4">Resumen del pedido</h3>

      {/* Line Items */}
      <div className="space-y-3 mb-4">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-on-surface">
                {item.plan.name}
              </p>
              {item.quantity > 1 && (
                <p className="text-xs text-on-surface-variant">
                  {item.quantity} × {fmt(item.plan.price)}
                </p>
              )}
            </div>
            <p className="text-sm font-medium text-on-surface ml-4 shrink-0">
              {fmt(item.subtotal)}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-outline-variant/30 -mx-6 mb-4" />

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between text-body-sm text-on-surface-variant">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-body-sm text-success">
            <span>Descuento</span>
            <span>-{fmt(discount)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-on-surface pt-2 border-t border-outline-variant/20">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      {/* FUTURE STRIPE: Stripe tax and fee breakdown */}
      {/* <div className="mt-2 text-label-caps text-on-surface-variant">
        * Los impuestos se calcularán al procesar el pago
      </div> */}
    </div>
  );
}
