import { IEvent } from '@nestjs/cqrs';

export class BalanceAdjustedEvent implements IEvent {
  constructor(
    public readonly studentId: string,
    public readonly amount: number,
    public readonly reason: string,
    public readonly newBalance: number,
  ) {}
}
