/**
 * PaymentMethodSelector
 *
 * PLACEHOLDER — Component for selecting a payment method.
 *
 * FUTURE STRIPE: Replace with Stripe PaymentElement which renders
 * cards, wallets (Apple Pay, Google Pay), and saved methods.
 *   <PaymentElement />
 *
 * @see https://stripe.com/docs/payments/payment-element
 */

'use client';

import { cn } from '@/lib/utils';
import type { PaymentMethodType } from '@/types/payment';

interface PaymentMethodOption {
  type: PaymentMethodType;
  label: string;
  icon: string;
  description: string;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    type: 'card',
    label: 'Tarjeta de crédito/débito',
    icon: 'credit_card',
    description: 'Visa, Mastercard, Maestro',
  },
  {
    type: 'transfer',
    label: 'Transferencia bancaria',
    icon: 'account_balance',
    description: '2-3 días hábiles',
  },
  {
    type: 'cash',
    label: 'Efectivo en academia',
    icon: 'payments',
    description: 'Paga en nuestras oficinas',
  },
];

interface PaymentMethodSelectorProps {
  selected: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
  className?: string;
}

export function PaymentMethodSelector({
  selected,
  onChange,
  className,
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="font-semibold text-on-surface">Método de pago</h3>

      {PAYMENT_METHODS.map(method => (
        <button
          key={method.type}
          type="button"
          onClick={() => onChange(method.type)}
          className={cn(
            'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
            selected === method.type
              ? 'border-primary bg-primary-container/20 ring-2 ring-primary/20'
              : 'border-outline-variant/30 bg-white hover:border-primary/30 hover:bg-surface-container-low'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              selected === method.type
                ? 'bg-primary text-white'
                : 'bg-surface-container-high text-on-surface-variant'
            )}
          >
            <span className="material-symbols-outlined text-[22px]">
              {method.icon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-on-surface">
              {method.label}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {method.description}
            </p>
          </div>
          {selected === method.type && (
            <span className="material-symbols-outlined text-primary shrink-0">
              check_circle
            </span>
          )}
        </button>
      ))}

      {/* PLACEHOLDER: Stripe PaymentElement will go here */}
      {/* FUTURE STRIPE: 
        <div id="stripe-payment-element" className="mt-4">
          <PaymentElement />
        </div>
      */}

      <p className="text-label-caps text-on-surface-variant/60 mt-2">
        Tus datos de pago están seguros con encriptación SSL.
        {/* FUTURE STRIPE: Stripe Elements handles PCI compliance */}
      </p>
    </div>
  );
}
