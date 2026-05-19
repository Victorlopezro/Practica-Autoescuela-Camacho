import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    jest.clearAllMocks();
  });

  it('should create an audit log entry with all fields', async () => {
    const expectedLog = {
      id: 'audit-1',
      userId: 'user-1',
      action: 'update-reservation',
      oldValue: { status: 'pending' },
      newValue: { status: 'confirmed' },
      reason: 'Admin confirmed the reservation',
      createdAt: new Date(),
    };

    prisma.auditLog.create.mockResolvedValue(expectedLog);

    const result = await service.log({
      userId: 'user-1',
      action: 'update-reservation',
      oldValue: { status: 'pending' },
      newValue: { status: 'confirmed' },
      reason: 'Admin confirmed the reservation',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: 'update-reservation',
        oldValue: { status: 'pending' },
        newValue: { status: 'confirmed' },
        reason: 'Admin confirmed the reservation',
      },
    });
    expect(result).toEqual(expectedLog);
  });

  it('should create an audit log entry with minimal fields', async () => {
    const expectedLog = {
      id: 'audit-2',
      userId: 'user-1',
      action: 'login',
      oldValue: undefined,
      newValue: undefined,
      reason: undefined,
      createdAt: new Date(),
    };

    prisma.auditLog.create.mockResolvedValue(expectedLog);

    const result = await service.log({
      userId: 'user-1',
      action: 'login',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: 'login',
        oldValue: undefined,
        newValue: undefined,
        reason: undefined,
      },
    });
    expect(result).toEqual(expectedLog);
  });
});
