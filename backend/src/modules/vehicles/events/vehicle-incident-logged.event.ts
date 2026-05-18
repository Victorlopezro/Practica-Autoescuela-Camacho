import { IEvent } from '@nestjs/cqrs';

export class VehicleIncidentLoggedEvent implements IEvent {
  constructor(
    public readonly vehicleId: string,
    public readonly incidentId: string,
    public readonly description: string,
    public readonly date: Date,
  ) {}
}
