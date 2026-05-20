import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PaymentsController } from './payments.controller';
import { CreateCheckoutSessionHandler } from './commands/create-checkout-session.handler';
import { HandleStripeWebhookHandler } from './commands/handle-stripe-webhook.handler';
import { MockStripeProvider } from './providers/mock-stripe-provider';

const handlers = [CreateCheckoutSessionHandler, HandleStripeWebhookHandler];

@Module({
  imports: [CqrsModule],
  controllers: [PaymentsController],
  providers: [
    ...handlers,
    { provide: 'PAYMENT_PROVIDER', useClass: MockStripeProvider },
    MockStripeProvider,
  ],
  exports: [MockStripeProvider],
})
export class PaymentsModule {}
