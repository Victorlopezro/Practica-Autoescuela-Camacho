import { ICommand } from '@nestjs/cqrs';

export class AdjustBalanceCommand implements ICommand {
  constructor(
    public readonly studentId: string,
    public readonly amount: number,
    public readonly reason: string,
    public readonly adjustedBy: string,
  ) {}
}
