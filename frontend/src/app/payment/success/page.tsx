/**
 * Payment Success Page
 *
 * Shown after a successful payment. Uses the PaymentSuccess component
 * to display the transaction details.
 *
 * FUTURE STRIPE: This page will receive the PaymentIntent parameters
 * via URL search params after Stripe redirects back to the app.
 *   /payment/success?payment_intent=pi_xxx&redirect_status=succeeded
 */

'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PaymentSuccess } from '@/components/payments/PaymentSuccess';
import { paymentService } from '@/services/payments';
import type { PaymentTransaction } from '@/types/payment';

/** Inner component that uses useSearchParams (needs Suspense wrapper) */
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  // FUTURE STRIPE: Read payment_intent from URL params
  // const paymentIntentId = searchParams.get('payment_intent');
  // const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    async function loadTransaction() {
      setLoading(true);
      try {
        // FUTURE STRIPE: Fetch the PaymentIntent from Stripe to confirm success
        // const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        // For now, get the most recent transaction for the mock user
        const history = await paymentService.getPaymentHistory('student-1');
        const latest = history.find(t => t.status === 'paid');
        if (latest) setTransaction(latest);
      } catch {
        // Transaction not found — show generic success
      } finally {
        setLoading(false);
      }
    }
    loadTransaction();
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-outline-variant/30 bg-white">
        <div className="max-w-2xl mx-auto px-gutter h-16 flex items-center">
          <Link href="/">
            <img src="/logo.svg" alt="Autoescuela Camacho" className="h-10 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-gutter py-xl">
        {transaction ? (
          <PaymentSuccess transaction={transaction} />
        ) : (
          /* Generic success when no transaction is found */
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <span className="material-symbols-outlined text-primary text-[40px]">check</span>
            </div>
            <h2 className="text-headline-md font-bold text-on-surface mb-2">
              ¡Pago realizado con éxito!
            </h2>
            <p className="text-body-sm text-on-surface-variant mb-8">
              Tu transacción se ha completado. Recibirás un correo de confirmación.
            </p>
            <Link
              href="/student/dashboard"
              className="inline-block w-full bg-primary text-white py-3 rounded-xl font-semibold text-center hover:bg-primary/90 transition-colors"
            >
              Ir al inicio
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

/** Page component with Suspense boundary for useSearchParams */
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-background flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
