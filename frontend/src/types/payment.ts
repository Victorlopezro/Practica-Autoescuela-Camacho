/**
 * Payment System Types
 *
 * STRIPE PLACEHOLDER — This file defines the payment domain types for the
 * Autoescuela Camacho frontend. When Stripe is integrated, the following
 * fields will connect to real Stripe objects:
 *   - stripePriceId → Stripe Price API
 *   - stripeProductId → Stripe Product API
 *   - stripePaymentIntentId → Stripe PaymentIntent
 *   - stripeClientSecret → Stripe PaymentIntent.client_secret
 *
 * @see https://stripe.com/docs/api
 */

import type { Payment as BasePayment, PaymentStatus as BasePaymentStatus } from './index';

/* ─── Payment Status ─────────────────────────────────────────── */

/**
 * Extended payment statuses including Stripe-native states.
 * Maps to Stripe PaymentIntent statuses.
 * @see https://stripe.com/docs/api/payment_intents/object#payment_intent_object-status
 */
export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';

/** Maps Stripe PaymentIntent status to our local status */
export function mapStripeStatus(stripeStatus: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    requires_payment_method: 'pending',
    requires_confirmation: 'pending',
    processing: 'pending',
    succeeded: 'paid',
    canceled: 'cancelled',
    requires_action: 'pending',
  };
  return map[stripeStatus] ?? 'failed';
}

/* ─── Payment Methods ─────────────────────────────────────────── */

export type PaymentMethodType = 'card' | 'transfer' | 'cash';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  /** Last 4 digits (for card methods) */
  last4?: string;
  /** Card brand (visa, mastercard, etc.) */
  brand?: string;
  /** Expiration month (1-12) */
  expMonth?: number;
  /** Expiration year */
  expYear?: number;
  /** Whether this is the default payment method */
  isDefault: boolean;
  /**
   * FUTURE STRIPE: This will hold the Stripe PaymentMethod ID
   * @see https://stripe.com/docs/api/payment_methods
   */
  stripePaymentMethodId?: string;
}

/* ─── Payment Plans ───────────────────────────────────────────── */

export type PlanType = 'one-time' | 'bundle' | 'subscription';

export interface BasePlan {
  id: string;
  type: PlanType;
  name: string;
  description: string;
  price: number;
  /** Currency code (EUR for now) */
  currency: string;
  /** Localized price string for display */
  formattedPrice: string;
  /**
   * FUTURE STRIPE: Stripe Price ID (price_xxx)
   * @see https://stripe.com/docs/api/prices
   */
  stripePriceId?: string;
  /**
   * FUTURE STRIPE: Stripe Product ID (prod_xxx)
   * @see https://stripe.com/docs/api/products
   */
  stripeProductId?: string;
}

export interface ClassBundle extends BasePlan {
  type: 'bundle';
  classCount: number;
  /** Per-class price, shown to highlight savings */
  pricePerClass: number;
  /** Whether to highlight as "Most popular" */
  popular: boolean;
  /** Savings text e.g. "Ahorra 30 €" */
  savingsLabel?: string;
}

export interface SubscriptionPlan extends BasePlan {
  type: 'subscription';
  interval: 'monthly' | 'yearly';
  features: string[];
  /** Free trial in days (0 = no trial) */
  trialDays: number;
  popular: boolean;
}

export interface OneTimeFee extends BasePlan {
  type: 'one-time';
  category: 'exam' | 'license' | 'material';
}

export type PaymentPlan = ClassBundle | SubscriptionPlan | OneTimeFee;

/* ─── Checkout ────────────────────────────────────────────────── */

export interface CheckoutItem {
  planId: string;
  quantity: number;
}

export interface CheckoutLineItem {
  plan: PaymentPlan;
  quantity: number;
  subtotal: number;
}

export interface CheckoutState {
  items: CheckoutLineItem[];
  subtotal: number;
  /** Any discount amount */
  discount: number;
  total: number;
  currency: string;
  selectedMethodId?: string;
  /**
   * FUTURE STRIPE: Stripe PaymentIntent ID
   * @see https://stripe.com/docs/api/payment_intents
   */
  stripePaymentIntentId?: string;
  /**
   * FUTURE STRIPE: Client secret for PaymentElement
   * @see https://docs.stripe.com/js/elements_object/create_payment_element
   */
  stripeClientSecret?: string;
}

/* ─── Payment Transaction ─────────────────────────────────────── */

export interface PaymentTransaction {
  id: string;
  userId: string;
  userRole: 'student' | 'teacher' | 'admin';
  planId: string;
  planName: string;
  planType: PlanType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethodType;
  /** Description of what was purchased */
  concept: string;
  createdAt: Date;
  paidAt?: Date;
  refundedAt?: Date;
  /**
   * FUTURE STRIPE: Stripe PaymentIntent ID
   */
  stripePaymentIntentId?: string;
  /**
   * FUTURE STRIPE: Stripe Charge ID
   */
  stripeChargeId?: string;
  /** Human-readable failure reason (from Stripe or local) */
  failureReason?: string;
  /** Whether a receipt was sent */
  receiptSent: boolean;
  /** URL to receipt (future Stripe hosted link) */
  receiptUrl?: string;
}

/* ─── Billing / Invoice ───────────────────────────────────────── */

export interface Invoice {
  id: string;
  transactionId: string;
  number: string;
  issuedAt: Date;
  paidAt?: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: PaymentStatus;
}

/* ─── Billing Summary ─────────────────────────────────────────── */

export interface BillingSummary {
  /** Total pending amount */
  pendingAmount: number;
  /** Total paid this month */
  paidThisMonth: number;
  /** Active subscription (if any) */
  activeSubscription?: SubscriptionPlan;
  /** Remaining classes if user has bundles */
  remainingClasses?: number;
  /** Total classes purchased */
  totalClasses?: number;
  /** Last payment date */
  lastPaymentDate?: Date;
}

/* ─── Payment Errors ──────────────────────────────────────────── */

export interface PaymentError {
  code: string;
  message: string;
  /** HTTP status or Stripe decline code */
  statusCode?: number;
  /**
   * FUTURE STRIPE: Stripe error type
   * @see https://stripe.com/docs/api/errors
   */
  stripeErrorType?: string;
  /** Whether the error is recoverable (e.g. retry) */
  recoverable: boolean;
}
