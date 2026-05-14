/**
 * Mock Payment Service
 *
 * PLACEHOLDER — This service simulates payment operations. Every method
 * that will eventually call Stripe APIs is clearly marked with a
 * "FUTURE STRIPE" comment.
 *
 * Migration plan:
 *   1. Replace each mock method body with the real Stripe API call
 *   2. Use stripePaymentIntentId and stripeClientSecret for PaymentElement
 *   3. Replace checkout creation with Stripe Checkout Session creation
 *
 * @see https://stripe.com/docs/payments/accept-a-payment
 */

import type {
  PaymentStatus,
  PaymentTransaction,
  CheckoutItem,
  CheckoutLineItem,
  CheckoutState,
  BillingSummary,
  PaymentError,
} from '@/types/payment';
import { getPlanById } from './plans';

/* ─── Mock Database ───────────────────────────────────────────── */

/** Simulated delay for async operations */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/** In-memory mock transactions store */
let mockTransactions: PaymentTransaction[] = [
  {
    id: 'txn-001',
    userId: 'student-1',
    userRole: 'student',
    planId: 'bundle-10',
    planName: '10 Clases',
    planType: 'bundle',
    amount: 179.99,
    currency: 'EUR',
    status: 'paid',
    method: 'card',
    concept: 'Paquete 10 clases',
    createdAt: new Date('2025-01-15'),
    paidAt: new Date('2025-01-15'),
    receiptSent: true,
  },
  {
    id: 'txn-002',
    userId: 'student-1',
    userRole: 'student',
    planId: 'bundle-10',
    planName: '10 Clases',
    planType: 'bundle',
    amount: 179.99,
    currency: 'EUR',
    status: 'pending',
    method: 'transfer',
    concept: 'Paquete 10 clases',
    createdAt: new Date('2025-03-01'),
    receiptSent: false,
  },
  {
    id: 'txn-003',
    userId: 'student-2',
    userRole: 'student',
    planId: 'bundle-15',
    planName: '15 Clases',
    planType: 'bundle',
    amount: 249.99,
    currency: 'EUR',
    status: 'paid',
    method: 'card',
    concept: 'Paquete 15 clases',
    createdAt: new Date('2025-02-01'),
    paidAt: new Date('2025-02-01'),
    receiptSent: true,
  },
  {
    id: 'txn-004',
    userId: 'student-1',
    userRole: 'student',
    planId: 'fee-exam-theory',
    planName: 'Tasa Examen Teórico',
    planType: 'one-time',
    amount: 94.00,
    currency: 'EUR',
    status: 'paid',
    method: 'cash',
    concept: 'Tasas DGT',
    createdAt: new Date('2025-02-10'),
    paidAt: new Date('2025-02-10'),
    receiptSent: false,
  },
  {
    id: 'txn-005',
    userId: 'student-1',
    userRole: 'student',
    planId: 'bundle-10',
    planName: '10 Clases',
    planType: 'bundle',
    amount: 179.99,
    currency: 'EUR',
    status: 'refunded',
    method: 'card',
    concept: 'Paquete 10 clases (devuelto)',
    createdAt: new Date('2024-11-01'),
    paidAt: new Date('2024-11-01'),
    refundedAt: new Date('2024-11-15'),
    receiptSent: true,
  },
];

/* ─── Service ─────────────────────────────────────────────────── */

export const paymentService = {
  /**
   * Get payment history for a user.
   * FUTURE STRIPE: Fetch from Stripe or local DB.
   */
  async getPaymentHistory(userId: string): Promise<PaymentTransaction[]> {
    await delay(400);
    return mockTransactions
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Get billing summary for a user.
   * FUTURE STRIPE: Aggregate from Stripe Subscription + Invoice data.
   */
  async getBillingSummary(userId: string): Promise<BillingSummary> {
    await delay(300);
    const userTxns = mockTransactions.filter(t => t.userId === userId);
    const pending = userTxns
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    const paidThisMonth = userTxns
      .filter(t => {
        const now = new Date();
        return (
          t.status === 'paid' &&
          t.paidAt &&
          t.paidAt.getMonth() === now.getMonth() &&
          t.paidAt.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      pendingAmount: pending,
      paidThisMonth,
      remainingClasses: userId === 'student-1' ? 15 : 8,
      totalClasses: userId === 'student-1' ? 30 : 15,
      lastPaymentDate: userTxns.find(t => t.status === 'paid')?.paidAt,
    };
  },

  /**
   * Create a checkout session for the given items.
   * FUTURE STRIPE: Replace with Stripe Checkout Session creation.
   *   const session = await stripe.checkout.sessions.create({ ... });
   */
  async createCheckout(items: CheckoutItem[]): Promise<{
    state: CheckoutState;
    checkoutId: string;
  }> {
    await delay(500);

    const lineItems: CheckoutLineItem[] = items.map(item => {
      const plan = getPlanById(item.planId);
      if (!plan) throw new Error(`Plan not found: ${item.planId}`);
      return {
        plan,
        quantity: item.quantity,
        subtotal: plan.price * item.quantity,
      };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);

    // FUTURE STRIPE: Create a PaymentIntent here
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(subtotal * 100),
    //   currency: 'eur',
    // });

    return {
      checkoutId: `checkout-${Date.now()}`,
      state: {
        items: lineItems,
        subtotal,
        discount: 0,
        total: subtotal,
        currency: 'EUR',
        // FUTURE STRIPE: paymentIntent.id, paymentIntent.client_secret
        stripePaymentIntentId: 'pi_mock_' + Date.now(),
        stripeClientSecret: 'secret_mock_' + Date.now(),
      },
    };
  },

  /**
   * Process (simulate) a payment.
   * FUTURE STRIPE: Confirm the PaymentIntent on the server.
   *   await stripe.paymentIntents.confirm(paymentIntentId);
   */
  async processPayment(checkoutId: string): Promise<{
    success: boolean;
    transaction?: PaymentTransaction;
    error?: PaymentError;
  }> {
    await delay(1500); // Simulate processing time

    // Simulate 90% success rate
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      const txn: PaymentTransaction = {
        id: `txn-${Date.now()}`,
        userId: 'student-1',
        userRole: 'student',
        planId: 'bundle-10',
        planName: '10 Clases',
        planType: 'bundle',
        amount: 179.99,
        currency: 'EUR',
        status: 'paid',
        method: 'card',
        concept: 'Pago online',
        createdAt: new Date(),
        paidAt: new Date(),
        receiptSent: true,
        stripePaymentIntentId: 'pi_mock_' + Date.now(),
      };

      mockTransactions.unshift(txn);

      return { success: true, transaction: txn };
    }

    return {
      success: false,
      error: {
        code: 'payment_failed',
        message: 'La transacción fue rechazada. Intenta con otro método de pago.',
        statusCode: 402,
        // FUTURE STRIPE: stripeErrorType: 'card_declined'
        recoverable: true,
      },
    };
  },

  /**
   * Refund a payment (placeholder).
   * FUTURE STRIPE: stripe.refunds.create({ paymentIntent: 'pi_xxx' });
   */
  async refundPayment(transactionId: string): Promise<{
    success: boolean;
    error?: PaymentError;
  }> {
    await delay(700);
    const txn = mockTransactions.find(t => t.id === transactionId);
    if (!txn) {
      return {
        success: false,
        error: {
          code: 'not_found',
          message: 'Transacción no encontrada',
          recoverable: false,
        },
      };
    }
    txn.status = 'refunded';
    txn.refundedAt = new Date();
    return { success: true };
  },

  /**
   * Get a single transaction by ID.
   */
  async getTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    await delay(200);
    return mockTransactions.find(t => t.id === transactionId) ?? null;
  },

  /**
   * Add a mock transaction (used for testing).
   */
  async addMockTransaction(txn: PaymentTransaction): Promise<void> {
    mockTransactions.unshift(txn);
  },
};
