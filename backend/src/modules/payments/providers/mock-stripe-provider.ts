import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, StripeSession } from '../../../common/interfaces';

@Injectable()
export class MockStripeProvider implements PaymentProvider {
  private readonly logger = new Logger(MockStripeProvider.name);

  async createCheckoutSession(params: { reservationId: string; amount: number; metadata?: Record<string, string> }) {
    this.logger.log(`[MOCK] Creating checkout session for reservation ${params.reservationId}, amount ${params.amount}`);
    // TODO: Replace with real Stripe SDK call when STRIPE_SECRET_KEY is configured
    return {
      url: `https://mock-checkout.example.com/pay/${params.reservationId}`,
      sessionId: `cs_mock_${params.reservationId}_${Date.now()}`,
    };
  }

  verifyWebhookSignature(payload: string, sig: string): boolean {
    this.logger.log(`[MOCK] Verifying webhook signature`);
    // TODO: Replace with real stripe.webhooks.constructEvent() when STRIPE_WEBHOOK_SECRET is configured
    return true;
  }

  async retrieveSession(sessionId: string): Promise<StripeSession> {
    this.logger.log(`[MOCK] Retrieving session ${sessionId}`);
    return {
      id: sessionId,
      url: null,
      status: 'complete',
      amountTotal: 0,
      customerEmail: null,
    };
  }
}
