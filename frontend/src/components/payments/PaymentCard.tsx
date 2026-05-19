/**
 * PaymentCard
 *
 * Displays a single payment transaction in a card, consistent with the
 * existing Card component used across the app (white, rounded-xl, shadow-sm).
 *
 * Reuses visual patterns from:
 *   - student/payments/page.tsx (transaction rows)
 *   - admin/payments/page.tsx (transaction rows with student name)
 */

import { cn } from '@/lib/utils';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import type { PaymentTransaction } from '@/types/payment';

interface PaymentCardProps {
  transaction: PaymentTransaction;
  /** Show user name (for admin views) */
  showUserName?: boolean;
  className?: string;
}

/**
 * Format a date to Spanish short format: "15 ene 2025"
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function PaymentCard({
  transaction,
  className,
}: PaymentCardProps) {
  const { amount, currency, concept, status, createdAt, planName } = transaction;

  const formattedAmount = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-outline-variant/30 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)]',
        className
      )}
    >
      <div className="flex justify-between items-center">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-on-surface truncate">
            {concept}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            {planName}
            {' · '}
            {formatDate(createdAt)}
          </p>
        </div>
        <div className="text-right ml-4 shrink-0">
          <p className="font-bold text-on-surface">{formattedAmount}</p>
          <div className="mt-1">
            <PaymentStatusBadge status={status} />
          </div>
        </div>
      </div>
    </div>
  );
}
