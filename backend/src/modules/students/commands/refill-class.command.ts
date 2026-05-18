import { ICommand } from '@nestjs/cqrs';

export class RefillClassCommand implements ICommand {
  constructor(
    public readonly studentId: string,
    public readonly amount: number,
  ) {}
}
