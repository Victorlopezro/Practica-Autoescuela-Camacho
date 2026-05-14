/**
 * PaymentStatusBadge
 *
 * Renders a status badge for payment states using the app's color tokens.
 * Maps each payment status to the appropriate Stitch color scheme.
 *
 * FUTURE STRIPE: Add more granular Stripe statuses if needed (e.g. processing).
 */

import { cn } from '@/lib/utils';
import type { PaymentStatus } from '@/types/payment';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; classes: string; icon: string }
> = {
  pending: {
    label: 'Pendiente',
    classes: 'bg-tertiary-fixed text-tertiary',
    icon: 'schedule',
  },
  paid: {
    label: 'Pagado',
    classes: 'bg-primary-container text-primary',
    icon: 'check_circle',
  },
  failed: {
    label: 'Rechazado',
    classes: 'bg-error-container text-on-error-container',
    icon: 'error',
  },
  refunded: {
    label: 'Reembolsado',
    classes: 'bg-surface-container-high text-on-surface-variant',
    icon: 'undo',
  },
  cancelled: {
    label: 'Cancelado',
    classes: 'bg-surface-container text-on-surface-variant/60',
    icon: 'cancel',
  },
};

export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-label-caps px-2 py-0.5 rounded-full font-medium',
        config.classes,
        className
      )}
    >
      <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
      {config.label}
    </span>
  );
}
