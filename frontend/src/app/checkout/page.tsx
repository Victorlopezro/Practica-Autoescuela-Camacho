/**
 * Checkout Page
 *
 * PLACEHOLDER — Checkout page that accepts a plan ID via search params
 * (e.g. /checkout?plan=bundle-10) and guides the user through payment.
 *
 * FUTURE STRIPE:
 *   1. Replace payment method selector with Stripe PaymentElement
 *   2. Call stripe.confirmPayment() instead of mock processPayment
 *   3. Handle 3D Secure redirects
 *   4. Use Stripe Elements for card input
 *
 * Flow: Select plan → Review summary → Choose method → Confirm → Payment
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { CheckoutSummary } from '@/components/payments/CheckoutSummary';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { PaymentErrorDisplay } from '@/components/payments/PaymentError';
import { useCheckout } from '@/hooks/useCheckout';
import { getPlanById, CLASS_BUNDLES, ONE_TIME_FEES } from '@/services/payments';
import type { PaymentMethodType } from '@/types/payment';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan');

  const {
    phase,
    checkoutState,
    error,
    initiateCheckout,
    confirmPayment,
    reset,
  } = useCheckout();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');

  // Load plan data from the URL param
  const plan = planId ? getPlanById(planId) : null;

  // Start checkout when plan is selected
  const handleStartCheckout = useCallback(async () => {
    if (!planId) return;
    await initiateCheckout([{ planId, quantity: 1 }]);
  }, [planId, initiateCheckout]);

  const handlePay = useCallback(async () => {
    await confirmPayment();
    if (phase === 'success') {
      router.push('/payment/success');
    }
  }, [confirmPayment, phase, router]);

  // Success state is handled by redirect to /payment/success
  if (phase === 'success') {
    router.push('/payment/success');
    return null;
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Simple header */}
      <header className="border-b border-outline-variant/30 bg-white">
        <div className="max-w-2xl mx-auto px-gutter h-16 flex items-center">
          <Link href="/">
            <img src="/logo.svg" alt="Autoescuela Camacho" className="h-10 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-gutter py-xl">
        {/* Error state */}
        {phase === 'error' && error && (
          <PaymentErrorDisplay
            error={error}
            onRetry={handlePay}
            onBack={reset}
          />
        )}

        {/* Processing state */}
        {phase === 'processing' && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-headline-md font-bold text-on-surface mb-2">
              Procesando pago...
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              No cierres esta página. Esto tomará solo unos segundos.
            </p>
          </div>
        )}

        {/* Confirm state — show summary + payment method */}
        {phase === 'confirm' && checkoutState && (
          <div className="space-y-8">
            <div>
              <h1 className="text-headline-md font-bold text-on-surface">
                Finalizar compra
              </h1>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Revisa tu pedido antes de pagar
              </p>
            </div>

            <CheckoutSummary state={checkoutState} />

            <PaymentMethodSelector
              selected={selectedMethod}
              onChange={setSelectedMethod}
            />

            <button
              onClick={handlePay}
              className="w-full bg-primary text-white py-4 rounded-xl text-headline-md font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              Pagar ahora
              <span className="material-symbols-outlined">lock</span>
            </button>

            <p className="text-center text-label-caps text-on-surface-variant/60">
              Pago seguro con encriptación SSL
              {/* FUTURE STRIPE: Powered by Stripe */}
            </p>
          </div>
        )}

        {/* Idle / loading state — show plan catalog */}
        {(phase === 'idle' || phase === 'loading') && (
          <div className="space-y-8">
            <div>
              <h1 className="text-headline-md font-bold text-on-surface">
                {plan ? 'Confirmar selección' : 'Elige tu plan'}
              </h1>
              <p className="text-body-sm text-on-surface-variant mt-1">
                {plan
                  ? 'Revisa el plan seleccionado antes de continuar'
                  : 'Selecciona un paquete de clases o servicio'}
              </p>
            </div>

            {/* If a plan is already selected, show it */}
            {plan && (
              <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-on-surface">{plan.name}</h3>
                    <p className="text-body-sm text-on-surface-variant mt-1">{plan.description}</p>
                  </div>
                  <p className="text-headline-md font-bold text-primary">{plan.formattedPrice}</p>
                </div>
              </div>
            )}

            {/* Class bundles grid */}
            {!plan && (
              <>
                <section>
                  <h2 className="font-semibold text-on-surface mb-4">Bonos de clases</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {CLASS_BUNDLES.map(bundle => (
                      <button
                        key={bundle.id}
                        onClick={() => router.push(`/checkout?plan=${bundle.id}`)}
                        className="bg-white rounded-xl border border-outline-variant/30 p-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)] text-left hover:border-primary/40 hover:shadow-md transition-all relative cursor-pointer"
                      >
                        {bundle.popular && (
                          <span className="absolute -top-2.5 right-4 bg-primary text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                        <h3 className="font-semibold text-on-surface">{bundle.name}</h3>
                        <p className="text-label-caps text-on-surface-variant mt-1">
                          {bundle.classCount} clases prácticas
                        </p>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-headline-md font-bold text-primary">
                            {bundle.formattedPrice}
                          </span>
                          <span className="text-label-caps text-on-surface-variant">
                            ({bundle.pricePerClass.toFixed(2)} €/clase)
                          </span>
                        </div>
                        {bundle.savingsLabel && (
                          <p className="text-label-caps text-success font-medium mt-1">
                            {bundle.savingsLabel}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* One-time fees */}
                <section>
                  <h2 className="font-semibold text-on-surface mb-4">Tasas y servicios</h2>
                  <div className="space-y-3">
                    {ONE_TIME_FEES.map(fee => (
                      <button
                        key={fee.id}
                        onClick={() => router.push(`/checkout?plan=${fee.id}`)}
                        className="w-full bg-white rounded-xl border border-outline-variant/30 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex justify-between items-center hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div>
                          <h3 className="text-sm font-medium text-on-surface">{fee.name}</h3>
                          <p className="text-xs text-on-surface-variant mt-0.5">{fee.description}</p>
                        </div>
                        <p className="font-bold text-primary">{fee.formattedPrice}</p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* FUTURE STRIPE: Subscription plans would go here */}
                {/* <section>
                  <h2 className="font-semibold text-on-surface mb-4">Planes de suscripción</h2>
                  ...
                </section> */}
              </>
            )}

            {/* If plan is selected, show continue button */}
            {plan && phase === 'idle' && (
              <button
                onClick={handleStartCheckout}
                className="w-full bg-primary text-white py-4 rounded-xl text-headline-md font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
              >
                Continuar al pago
              </button>
            )}

            {phase === 'loading' && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/** Page component with Suspense boundary for useSearchParams */
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-background flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
