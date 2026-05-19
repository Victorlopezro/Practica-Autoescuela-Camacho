export interface StripeSession {
  id: string;
  url: string | null;
  status: string;
  amountTotal: number;
  customerEmail: string | null;
}

export interface PaymentProvider {
  createCheckoutSession(params: {
    reservationId: string;
    amount: number;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; sessionId: string }>;

  verifyWebhookSignature(payload: string, sig: string): boolean;

  retrieveSession(sessionId: string): Promise<StripeSession>;
}
