// Backend has minimal Stripe-only payments. Keep it simple.
export interface IPaymentService {
  getHistory(userId: string): Promise<unknown[]>;
}
