import { ICommand } from '@nestjs/cqrs';

export class UpdateVehicleCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly plate?: string,
    public readonly type?: string,
    public readonly status?: string,
    public readonly itvExpiry?: Date,
  ) {}
}
