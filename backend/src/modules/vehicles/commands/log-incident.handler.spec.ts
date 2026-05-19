import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { LogIncidentHandler } from './log-incident.handler';
import { LogIncidentCommand } from './log-incident.command';
import { VehicleIncidentLoggedEvent } from '../events/vehicle-incident-logged.event';

describe('LogIncidentHandler', () => {
  let handler: LogIncidentHandler;
  let prisma: any;
  let eventBus: any;

  const mockVehicle = {
    id: 'vehicle-1',
    plate: '1234ABC',
  };

  const mockIncident = {
    id: 'incident-1',
    vehicleId: 'vehicle-1',
    description: 'Left blinker not working',
    date: new Date('2026-05-18'),
  };

  beforeEach(async () => {
    prisma = {
      vehicle: {
        findUnique: jest.fn(),
      },
      vehicleIncident: {
        create: jest.fn(),
      },
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogIncidentHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<LogIncidentHandler>(LogIncidentHandler);
    jest.clearAllMocks();
  });

  it('should create incident and publish event when vehicle exists', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
    prisma.vehicleIncident.create.mockResolvedValue(mockIncident);

    const result = await handler.execute(
      new LogIncidentCommand('vehicle-1', 'Left blinker not working', new Date('2026-05-18')),
    );

    expect(result).toEqual(mockIncident);
    expect(prisma.vehicleIncident.create).toHaveBeenCalledWith({
      data: {
        vehicleId: 'vehicle-1',
        description: 'Left blinker not working',
        date: expect.any(Date),
      },
    });
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(VehicleIncidentLoggedEvent),
    );
  });

  it('should throw NotFoundException when vehicle does not exist', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new LogIncidentCommand('unknown', 'test', new Date())),
    ).rejects.toThrow(NotFoundException);
  });

  it('should not create incident or publish event when vehicle not found', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new LogIncidentCommand('unknown', 'test', new Date())),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.vehicleIncident.create).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
