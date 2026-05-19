import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    reason?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        oldValue: params.oldValue as Prisma.InputJsonValue ?? undefined,
        newValue: params.newValue as Prisma.InputJsonValue ?? undefined,
        reason: params.reason,
      },
    });
  }
}
