import { ICommand } from '@nestjs/cqrs';

export class CreateReservationCommand implements ICommand {
  constructor(
    public readonly studentId: string,
    public readonly teacherId: string,
    public readonly vehicleType: string,
    public readonly startTime: Date,
    public readonly duration: number,
    public readonly userId: string,
  ) {}
}
