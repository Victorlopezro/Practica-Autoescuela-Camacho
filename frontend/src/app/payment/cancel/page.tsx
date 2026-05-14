/**
 * Payment Cancel Page
 *
 * Shown when the user cancels the payment or is redirected back
 * after abandoning the Stripe Checkout / PaymentElement.
 *
 * FUTURE STRIPE: This page will receive Stripe redirect parameters:
 *   /payment/cancel?payment_intent=pi_xxx
 */

'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
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
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <span className="material-symbols-outlined text-on-surface-variant text-[40px]">
              remove_shopping_cart
            </span>
          </div>

          <h2 className="text-headline-md font-bold text-on-surface mb-2">
            Pago cancelado
          </h2>
          <p className="text-body-sm text-on-surface-variant mb-8">
            No se ha realizado ningún cargo. Puedes volver a intentarlo cuando quieras.
          </p>

          {/* FUTURE STRIPE: If payment_intent is in URL, cancel it server-side */}
          {/* const paymentIntentId = searchParams.get('payment_intent');
              if (paymentIntentId) {
                await fetch('/api/stripe/cancel-payment', {
                  method: 'POST',
                  body: JSON.stringify({ paymentIntentId }),
                });
              }
          */}

          <div className="flex flex-col gap-3">
            <Link
              href="/checkout"
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-center hover:bg-primary/90 transition-colors"
            >
              Intentar de nuevo
            </Link>
            <Link
              href="/student/dashboard"
              className="w-full bg-white border border-outline-variant/30 text-on-surface-variant py-3 rounded-xl font-medium text-center hover:bg-surface-container transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
