import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { UpdateVehicleHandler } from './update-vehicle.handler';
import { UpdateVehicleCommand } from './update-vehicle.command';

describe('UpdateVehicleHandler', () => {
  let handler: UpdateVehicleHandler;
  let prisma: any;

  const mockVehicle = {
    id: 'vehicle-1',
    plate: '1234ABC',
    type: 'coche-manual',
    status: 'available',
    itvExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      vehicle: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateVehicleHandler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    handler = module.get<UpdateVehicleHandler>(UpdateVehicleHandler);
    jest.clearAllMocks();
  });

  it('should update a vehicle with partial data', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
    prisma.vehicle.update.mockResolvedValue({
      ...mockVehicle,
      plate: 'NEW123',
      status: 'maintenance',
    });

    const result = await handler.execute(
      new UpdateVehicleCommand('vehicle-1', 'NEW123', undefined, 'maintenance'),
    );

    expect(result.plate).toBe('NEW123');
    expect(result.status).toBe('maintenance');
    expect(prisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: { plate: 'NEW123', status: 'maintenance' },
    });
  });

  it('should throw NotFoundException when vehicle does not exist', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateVehicleCommand('unknown')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should only include defined fields in update data', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
    prisma.vehicle.update.mockResolvedValue(mockVehicle);

    await handler.execute(
      new UpdateVehicleCommand('vehicle-1', undefined, undefined, undefined, undefined),
    );

    expect(prisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
      data: {},
    });
  });
});
