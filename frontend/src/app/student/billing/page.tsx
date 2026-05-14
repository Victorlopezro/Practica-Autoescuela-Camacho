/**
 * Student Billing Page
 *
 * Shows the student's billing summary, payment history, and links
 * to purchase class bundles. Uses the usePayments hook for data.
 *
 * FUTURE STRIPE: Will show real Stripe subscription status,
 * upcoming invoices, and payment method management.
 *   - Stripe Customer Portal → manage subscriptions, cards, invoices
 *   - @see https://stripe.com/docs/billing/subscriptions/customer-portal
 */

'use client';

import Link from 'next/link';
import { PaymentCard } from '@/components/payments/PaymentCard';
import { usePayments } from '@/hooks/usePayments';
import { CLASS_BUNDLES } from '@/services/payments';

export default function StudentBillingPage() {
  const { transactions, summary, loading, error, refresh } = usePayments('student-1');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error state */}
      {error && (
        <div className="bg-error-container text-on-error-container rounded-xl p-4 text-body-sm">
          {error}
          <button
            onClick={refresh}
            className="ml-2 underline font-semibold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-outline-variant/30 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <p className="text-label-caps text-on-surface-variant uppercase">Pendiente</p>
          <p className="text-headline-md font-bold text-tertiary mt-1">
            {summary?.pendingAmount.toFixed(2).replace('.', ',')} €
          </p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/30 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <p className="text-label-caps text-on-surface-variant uppercase">Este mes</p>
          <p className="text-headline-md font-bold text-on-surface mt-1">
            {summary?.paidThisMonth.toFixed(2).replace('.', ',')} €
          </p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/30 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <p className="text-label-caps text-on-surface-variant uppercase">Clases</p>
          <p className="text-headline-md font-bold text-on-surface mt-1">
            {summary?.remainingClasses ?? '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/30 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
          <p className="text-label-caps text-on-surface-variant uppercase">Total</p>
          <p className="text-headline-md font-bold text-on-surface mt-1">
            {summary?.totalClasses ?? '—'}
          </p>
        </div>
      </div>

      {/* Buy more classes CTA */}
      <div className="bg-[#2b3f94] rounded-xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-semibold mb-1">¿Necesitas más clases?</h3>
            <p className="text-surface-container-high text-body-sm opacity-90">
              Recarga tu saldo con uno de nuestros bonos
            </p>
          </div>
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 bg-white text-[#2b3f94] px-5 py-2.5 rounded-lg font-bold text-label-caps hover:bg-surface-container transition-colors"
          >
            VER BONOS
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Quick bundle links */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {CLASS_BUNDLES.filter(b => b.popular || b.classCount <= 10).map(bundle => (
          <Link
            key={bundle.id}
            href={`/checkout?plan=${bundle.id}`}
            className="shrink-0 bg-white rounded-xl border border-outline-variant/30 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:border-primary/40 transition-all min-w-[140px]"
          >
            <p className="text-sm font-medium text-on-surface">{bundle.name}</p>
            <p className="text-label-caps text-primary font-bold mt-1">
              {bundle.formattedPrice}
            </p>
          </Link>
        ))}
      </div>

      {/* Payment History */}
      <div>
        <h3 className="font-semibold text-on-surface mb-4">Historial de pagos</h3>
        {transactions.length === 0 ? (
          <div className="bg-white rounded-xl border border-outline-variant/30 p-8 text-center">
            <span className="material-symbols-outlined text-[40px] text-outline mb-3">
              payments
            </span>
            <p className="text-body-sm text-on-surface-variant">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(txn => (
              <PaymentCard key={txn.id} transaction={txn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
