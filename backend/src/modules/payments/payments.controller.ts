import { Controller, Post, Body, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateCheckoutSessionDto } from './dto';
import { CreateCheckoutSessionCommand } from './commands/create-checkout-session.command';
import { HandleStripeWebhookCommand } from './commands/handle-stripe-webhook.command';

@ApiTags('Payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('create-session')
  @Roles('admin:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe checkout session for a reservation' })
  async createSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.commandBus.execute(
      new CreateCheckoutSessionCommand(dto.reservationId),
    );
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async webhook(@Req() req: any) {
    const signature = req.headers?.['stripe-signature'] ?? '';
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    return this.commandBus.execute(
      new HandleStripeWebhookCommand(rawBody, signature),
    );
  }
}
