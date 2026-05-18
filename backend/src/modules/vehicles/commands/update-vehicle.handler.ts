import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { UpdateVehicleCommand } from './update-vehicle.command';

@CommandHandler(UpdateVehicleCommand)
export class UpdateVehicleHandler implements ICommandHandler<UpdateVehicleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateVehicleCommand) {
    const { id, plate, type, status, itvExpiry } = command;

    const existing = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Vehicle not found');

    const data: Record<string, unknown> = {};
    if (plate !== undefined) data.plate = plate;
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (itvExpiry !== undefined) data.itvExpiry = itvExpiry;

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data,
    });

    return updated;
  }
}
