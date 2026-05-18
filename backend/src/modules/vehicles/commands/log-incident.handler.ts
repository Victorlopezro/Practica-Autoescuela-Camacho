import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { LogIncidentCommand } from './log-incident.command';
import { VehicleIncidentLoggedEvent } from '../events/vehicle-incident-logged.event';

@CommandHandler(LogIncidentCommand)
export class LogIncidentHandler implements ICommandHandler<LogIncidentCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LogIncidentCommand) {
    const { vehicleId, description, date } = command;

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const incident = await this.prisma.vehicleIncident.create({
      data: { vehicleId, description, date },
    });

    this.eventBus.publish(
      new VehicleIncidentLoggedEvent(vehicleId, incident.id, description, date),
    );

    return incident;
  }
}
