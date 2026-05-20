import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { PaymentsController } from './payments.controller';
import { CreateCheckoutSessionCommand } from './commands/create-checkout-session.command';
import { HandleStripeWebhookCommand } from './commands/handle-stripe-webhook.command';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let commandBus: any;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    jest.clearAllMocks();
  });

  describe('POST /payments/create-session', () => {
    it('should delegate to CreateCheckoutSessionCommand', async () => {
      const expected = { url: 'https://mock-checkout.example.com/pay/res-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.createSession({
        reservationId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateCheckoutSessionCommand),
      );
      expect(result).toEqual(expected);
    });
  });

  describe('POST /payments/webhook', () => {
    it('should delegate to HandleStripeWebhookCommand and return received', async () => {
      commandBus.execute.mockResolvedValue({ received: true });

      const mockReq = {
        headers: { 'stripe-signature': 'test_sig' },
        body: '{"type":"checkout.session.completed"}',
      };

      const result = await controller.webhook(mockReq);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(HandleStripeWebhookCommand),
      );
      expect(result).toEqual({ received: true });
    });

    it('should handle missing stripe-signature header', async () => {
      commandBus.execute.mockResolvedValue({ received: true });

      const mockReq = {
        headers: {},
        body: '{}',
      };

      const result = await controller.webhook(mockReq);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(HandleStripeWebhookCommand),
      );
      expect(result).toEqual({ received: true });
    });
  });
});
