import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MockStripeProvider } from '../providers/mock-stripe-provider';
import { HandleStripeWebhookCommand } from './handle-stripe-webhook.command';

@CommandHandler(HandleStripeWebhookCommand)
export class HandleStripeWebhookHandler implements ICommandHandler<HandleStripeWebhookCommand> {
  private readonly logger = new Logger(HandleStripeWebhookHandler.name);

  constructor(private readonly mockStripeProvider: MockStripeProvider) {}

  async execute(command: HandleStripeWebhookCommand) {
    const { rawBody, signature } = command;

    const isValid = this.mockStripeProvider.verifyWebhookSignature(
      rawBody,
      signature,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`[MOCK] Webhook received: ${rawBody.substring(0, 200)}`);
    return { received: true };
  }
}
