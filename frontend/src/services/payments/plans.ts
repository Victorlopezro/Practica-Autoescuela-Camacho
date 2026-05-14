/**
 * Payment Plans Configuration
 *
 * PLACEHOLDER — These are the class bundles, one-time fees, and subscription
 * plans available in the app. When Stripe is integrated, each plan will
 * link to a Stripe Product + Price via stripeProductId / stripePriceId.
 *
 * FUTURE STRIPE: Replace hardcoded prices with Stripe Prices API lookup.
 * @see https://stripe.com/docs/api/prices/list
 */

import type { ClassBundle, OneTimeFee, SubscriptionPlan } from '@/types/payment';

/**
 * Format a number as EUR price string
 */
function fmt(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/* ─── Class Bundles (Bonos de Clases) ─────────────────────────── */

export const CLASS_BUNDLES: ClassBundle[] = [
  // FUTURE STRIPE: Conectar con Stripe Price API
  {
    id: 'bundle-5',
    type: 'bundle',
    name: '5 Clases',
    description: 'Perfecto para empezar o repasar',
    price: 99.99,
    pricePerClass: 20.0,
    currency: 'EUR',
    formattedPrice: fmt(99.99),
    classCount: 5,
    popular: false,
  },
  {
    id: 'bundle-10',
    type: 'bundle',
    name: '10 Clases',
    description: 'El más popular — ahorra en cada clase',
    price: 179.99,
    pricePerClass: 18.0,
    currency: 'EUR',
    formattedPrice: fmt(179.99),
    classCount: 10,
    popular: true,
    savingsLabel: 'Ahorra 20 €',
    // FUTURE STRIPE: stripePriceId: 'price_xxx_bundle_10'
  },
  {
    id: 'bundle-15',
    type: 'bundle',
    name: '15 Clases',
    description: 'Ideal para preparación intensiva',
    price: 249.99,
    pricePerClass: 16.67,
    currency: 'EUR',
    formattedPrice: fmt(249.99),
    classCount: 15,
    popular: false,
    savingsLabel: 'Ahorra 50 €',
    // FUTURE STRIPE: stripePriceId: 'price_xxx_bundle_15'
  },
  {
    id: 'bundle-20',
    type: 'bundle',
    name: '20 Clases',
    description: 'Máximo ahorro para comprometidos',
    price: 299.99,
    pricePerClass: 15.0,
    currency: 'EUR',
    formattedPrice: fmt(299.99),
    classCount: 20,
    popular: false,
    savingsLabel: 'Ahorra 100 €',
    // FUTURE STRIPE: stripePriceId: 'price_xxx_bundle_20'
  },
];

/* ─── One-Time Fees (Tasas Únicas) ────────────────────────────── */

export const ONE_TIME_FEES: OneTimeFee[] = [
  {
    id: 'fee-exam-theory',
    type: 'one-time',
    name: 'Tasa Examen Teórico',
    description: 'Tasa oficial DGT para examen teórico',
    price: 94.00,
    currency: 'EUR',
    formattedPrice: fmt(94.00),
    category: 'exam',
    // FUTURE STRIPE: stripePriceId: 'price_xxx_fee_theory'
  },
  {
    id: 'fee-exam-practical',
    type: 'one-time',
    name: 'Tasa Examen Práctico',
    description: 'Tasa oficial DGT para examen práctico',
    price: 120.00,
    currency: 'EUR',
    formattedPrice: fmt(120.00),
    category: 'exam',
    // FUTURE STRIPE: stripePriceId: 'price_xxx_fee_practical'
  },
  {
    id: 'fee-license',
    type: 'one-time',
    name: 'Tasa Expedición Permiso',
    description: 'Tasa para la expedición del carnet',
    price: 30.00,
    currency: 'EUR',
    formattedPrice: fmt(30.00),
    category: 'license',
    // FUTURE STRIPE: stripePriceId: 'price_xxx_fee_license'
  },
];

/* ─── Subscription Plans (Futuras Suscripciones) ──────────────── */

/**
 * PLACEHOLDER: Subscription plans are NOT YET ACTIVE. They are defined
 * here for future Stripe integration when recurring billing is needed.
 * When ready, uncomment the relevant UI sections and connect to Stripe.
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'sub-monthly',
    type: 'subscription',
    name: 'Plan Mensual',
    description: 'Clases regulares cada semana',
    price: 49.99,
    currency: 'EUR',
    formattedPrice: fmt(49.99),
    interval: 'monthly',
    features: [
      '2 clases prácticas por semana',
      'Acceso completo a tests DGT',
      'Seguimiento de progreso',
      'Cancelación gratuita',
    ],
    trialDays: 7,
    popular: false,
    // FUTURE STRIPE: stripePriceId: 'price_xxx_sub_monthly'
  },
  {
    id: 'sub-premium',
    type: 'subscription',
    name: 'Plan Premium',
    description: 'Para los que quieren aprobar rápido',
    price: 79.99,
    currency: 'EUR',
    formattedPrice: fmt(79.99),
    interval: 'monthly',
    features: [
      '4 clases prácticas por semana',
      'Acceso completo a tests DGT',
      'Seguimiento de progreso',
      'Prioridad en reservas',
      'Informes de evolución',
    ],
    trialDays: 7,
    popular: true,
    // FUTURE STRIPE: stripePriceId: 'price_xxx_sub_premium'
  },
];

/* ─── Helpers ─────────────────────────────────────────────────── */

/** Get a plan by its ID from any category */
export function getPlanById(id: string) {
  return (
    CLASS_BUNDLES.find(p => p.id === id) ??
    ONE_TIME_FEES.find(p => p.id === id) ??
    SUBSCRIPTION_PLANS.find(p => p.id === id) ??
    null
  );
}

/** All plans flattened (useful for listing) */
export const ALL_PLANS = [
  ...CLASS_BUNDLES,
  ...ONE_TIME_FEES,
  ...SUBSCRIPTION_PLANS,
];
