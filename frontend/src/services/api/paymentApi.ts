import type { IPaymentService } from '../interfaces/payment.service';

export const paymentApi: IPaymentService = {
  async getHistory(_userId: string): Promise<unknown[]> {
    return [];
  },
};
