import { ICommand } from '@nestjs/cqrs';

export class LogIncidentCommand implements ICommand {
  constructor(
    public readonly vehicleId: string,
    public readonly description: string,
    public readonly date: Date,
  ) {}
}
