import { ICommand } from '@nestjs/cqrs';

export class CreateVehicleCommand implements ICommand {
  constructor(
    public readonly plate: string,
    public readonly type: string,
    public readonly itvExpiry?: Date,
  ) {}
}
