import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { DeleteVehicleHandler } from './delete-vehicle.handler';
import { DeleteVehicleCommand } from './delete-vehicle.command';

describe('DeleteVehicleHandler', () => {
  let handler: DeleteVehicleHandler;
  let prisma: any;

  const mockVehicle = {
    id: 'vehicle-1',
    plate: '1234ABC',
  };

  beforeEach(async () => {
    prisma = {
      vehicle: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteVehicleHandler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    handler = module.get<DeleteVehicleHandler>(DeleteVehicleHandler);
    jest.clearAllMocks();
  });

  it('should delete vehicle when it exists', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
    prisma.vehicle.delete.mockResolvedValue(mockVehicle);

    const result = await handler.execute(new DeleteVehicleCommand('vehicle-1'));

    expect(result).toEqual({ message: 'Vehicle deleted successfully' });
    expect(prisma.vehicle.delete).toHaveBeenCalledWith({
      where: { id: 'vehicle-1' },
    });
  });

  it('should throw NotFoundException when vehicle does not exist', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteVehicleCommand('unknown')),
    ).rejects.toThrow(NotFoundException);
  });
});
