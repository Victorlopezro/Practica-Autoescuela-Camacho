import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateVehicleCommand } from './create-vehicle.command';

@CommandHandler(CreateVehicleCommand)
export class CreateVehicleHandler implements ICommandHandler<CreateVehicleCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateVehicleCommand) {
    const { plate, type, itvExpiry } = command;

    const vehicle = await this.prisma.vehicle.create({
      data: {
        plate,
        type,
        itvExpiry,
      },
    });

    return vehicle;
  }
}
