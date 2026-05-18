import { ICommand } from '@nestjs/cqrs';

export class DeductClassCommand implements ICommand {
  constructor(
    public readonly studentId: string,
    public readonly duration: number,
    public readonly adjustedBy: string,
  ) {}
}
