import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateVehicleHandler } from './create-vehicle.handler';
import { CreateVehicleCommand } from './create-vehicle.command';

describe('CreateVehicleHandler', () => {
  let handler: CreateVehicleHandler;
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
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVehicleHandler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    handler = module.get<CreateVehicleHandler>(CreateVehicleHandler);
    jest.clearAllMocks();
  });

  it('should create a vehicle and return it', async () => {
    prisma.vehicle.create.mockResolvedValue(mockVehicle);

    const result = await handler.execute(
      new CreateVehicleCommand('1234ABC', 'coche-manual'),
    );

    expect(result).toEqual(mockVehicle);
    expect(prisma.vehicle.create).toHaveBeenCalledWith({
      data: {
        plate: '1234ABC',
        type: 'coche-manual',
        itvExpiry: undefined,
      },
    });
  });

  it('should create a vehicle with optional itvExpiry', async () => {
    const itvDate = new Date('2026-12-31');
    const vehicleWithItv = { ...mockVehicle, itvExpiry: itvDate };
    prisma.vehicle.create.mockResolvedValue(vehicleWithItv);

    const result = await handler.execute(
      new CreateVehicleCommand('5678DEF', 'moto-pista', itvDate),
    );

    expect(result).toEqual(vehicleWithItv);
    expect(prisma.vehicle.create).toHaveBeenCalledWith({
      data: {
        plate: '5678DEF',
        type: 'moto-pista',
        itvExpiry: itvDate,
      },
    });
  });
});
