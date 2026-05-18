import { ICommand } from '@nestjs/cqrs';

export class DeleteVehicleCommand implements ICommand {
  constructor(public readonly id: string) {}
}
