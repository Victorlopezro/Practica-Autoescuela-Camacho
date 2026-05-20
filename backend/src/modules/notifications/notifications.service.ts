import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { MockWhatsAppProvider } from './providers/mock-whatsapp-provider';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockWhatsAppProvider: MockWhatsAppProvider,
  ) {}

  async sendNotification(params: {
    recipient: string;
    channel: string;
    template: string;
    data: Record<string, unknown>;
  }) {
    const { recipient, channel, template, data } = params;

    // Save notification record with pending status
    const notification = await this.prisma.notification.create({
      data: {
        recipient,
        channel,
        template,
        data: (data as Prisma.InputJsonValue) ?? undefined,
        status: 'pending',
      },
    });

    try {
      const result = await this.mockWhatsAppProvider.send({
        to: recipient,
        template,
        data,
      });

      if (result.success) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'sent' },
        });
      } else {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'failed', error: result.error ?? 'Unknown error' },
        });
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[MOCK] Failed to send notification: ${errorMessage}`);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'failed', error: errorMessage },
      });

      return { success: false, error: errorMessage };
    }
  }
}
