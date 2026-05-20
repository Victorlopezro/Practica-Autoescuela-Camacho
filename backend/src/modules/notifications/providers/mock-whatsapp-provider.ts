import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationProvider,
  NotificationSendParams,
  NotificationSendResult,
} from '../../../common/interfaces';

@Injectable()
export class MockWhatsAppProvider implements NotificationProvider {
  private readonly logger = new Logger(MockWhatsAppProvider.name);

  async send(params: NotificationSendParams): Promise<NotificationSendResult> {
    this.logger.log(
      `[MOCK] Sending ${params.template} to ${params.to}: ${JSON.stringify(params.data)}`,
    );
    // TODO: Replace with real Meta Cloud API call when WHATSAPP_TOKEN is configured
    return { success: true };
  }
}
