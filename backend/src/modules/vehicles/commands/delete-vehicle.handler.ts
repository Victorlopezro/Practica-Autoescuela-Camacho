import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { DeleteVehicleCommand } from './delete-vehicle.command';

@CommandHandler(DeleteVehicleCommand)
export class DeleteVehicleHandler implements ICommandHandler<DeleteVehicleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteVehicleCommand) {
    const { id } = command;

    const existing = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Vehicle not found');

    await this.prisma.vehicle.delete({ where: { id } });

    return { message: 'Vehicle deleted successfully' };
  }
}
