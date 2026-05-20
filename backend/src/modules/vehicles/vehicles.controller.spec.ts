import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { VehiclesController } from './vehicles.controller';
import { CreateVehicleCommand } from './commands/create-vehicle.command';
import { UpdateVehicleCommand } from './commands/update-vehicle.command';
import { DeleteVehicleCommand } from './commands/delete-vehicle.command';
import { LogIncidentCommand } from './commands/log-incident.command';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let prisma: any;
  let commandBus: any;

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
        findMany: jest.fn(),
        count: jest.fn(),
      },
      vehicleIncident: {
        findMany: jest.fn(),
      },
    };
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should execute CreateVehicleCommand', async () => {
      commandBus.execute.mockResolvedValue(mockVehicle);

      const result = await controller.create({
        plate: '1234ABC',
        type: 'coche-manual',
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateVehicleCommand),
      );
      expect(result).toEqual(mockVehicle);
    });
  });

  describe('findAll', () => {
    it('should return paginated vehicles with default pagination', async () => {
      const vehicles = [mockVehicle];
      prisma.vehicle.findMany.mockResolvedValue(vehicles);
      prisma.vehicle.count.mockResolvedValue(1);

      const result = await controller.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('itvWarning');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply type and status filters', async () => {
      prisma.vehicle.findMany.mockResolvedValue([]);
      prisma.vehicle.count.mockResolvedValue(0);

      await controller.findAll('1', '20', 'moto-pista', 'available');

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'moto-pista', status: 'available' },
        }),
      );
    });

    it('should add itvWarning to each vehicle', async () => {
      const futureItv = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
      const vehicleWithItv = { ...mockVehicle, itvExpiry: futureItv };
      prisma.vehicle.findMany.mockResolvedValue([vehicleWithItv]);
      prisma.vehicle.count.mockResolvedValue(1);

      const result = await controller.findAll();

      expect(result.data[0].itvWarning).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should return vehicle with incidents when found', async () => {
      const vehicleWithIncidents = {
        ...mockVehicle,
        incidents: [{ id: 'inc-1', description: 'test', date: new Date() }],
      };
      prisma.vehicle.findUnique.mockResolvedValue(vehicleWithIncidents);

      const result = await controller.findOne('vehicle-1');

      expect(result).toHaveProperty('itvWarning');
      expect(result.id).toBe('vehicle-1');
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      await expect(controller.findOne('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should execute UpdateVehicleCommand', async () => {
      commandBus.execute.mockResolvedValue({ ...mockVehicle, plate: 'NEW456' });

      await controller.update('vehicle-1', {
        plate: 'NEW456',
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateVehicleCommand),
      );
    });
  });

  describe('remove', () => {
    it('should execute DeleteVehicleCommand', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.remove('vehicle-1');

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteVehicleCommand),
      );
    });
  });

  describe('logIncident', () => {
    it('should execute LogIncidentCommand', async () => {
      const mockIncident = {
        id: 'inc-1',
        vehicleId: 'vehicle-1',
        description: 'Broken light',
        date: new Date(),
      };
      commandBus.execute.mockResolvedValue(mockIncident);

      await controller.logIncident('vehicle-1', {
        description: 'Broken light',
        date: '2026-05-18T00:00:00.000Z',
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(LogIncidentCommand),
      );
    });
  });

  describe('findIncidents', () => {
    it('should return incidents for existing vehicle', async () => {
      const incidents = [
        {
          id: 'inc-1',
          vehicleId: 'vehicle-1',
          description: 'test',
          date: new Date(),
        },
      ];
      prisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1' });
      prisma.vehicleIncident.findMany.mockResolvedValue(incidents);

      const result = await controller.findIncidents('vehicle-1');

      expect(result).toEqual(incidents);
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      await expect(controller.findIncidents('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('itvWarning', () => {
    it('should set itvWarning to true when itvExpiry is within 30 days', async () => {
      const nearExpiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
      const vehicleNearExpiry = {
        ...mockVehicle,
        itvExpiry: nearExpiry,
        incidents: [],
      };
      prisma.vehicle.findUnique.mockResolvedValue(vehicleNearExpiry);

      const result = await controller.findOne('vehicle-1');

      expect(result.itvWarning).toBe(true);
    });

    it('should set itvWarning to false when itvExpiry is beyond 30 days', async () => {
      const farExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
      const vehicleFarExpiry = {
        ...mockVehicle,
        itvExpiry: farExpiry,
        incidents: [],
      };
      prisma.vehicle.findUnique.mockResolvedValue(vehicleFarExpiry);

      const result = await controller.findOne('vehicle-1');

      expect(result.itvWarning).toBe(false);
    });

    it('should set itvWarning to false when itvExpiry is null', async () => {
      const vehicleNoItv = {
        ...mockVehicle,
        itvExpiry: null,
        incidents: [],
      };
      prisma.vehicle.findUnique.mockResolvedValue(vehicleNoItv);

      const result = await controller.findOne('vehicle-1');

      expect(result.itvWarning).toBe(false);
    });
  });
});
