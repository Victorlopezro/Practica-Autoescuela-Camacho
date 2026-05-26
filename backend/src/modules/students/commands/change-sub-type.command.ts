import { ICommand } from '@nestjs/cqrs';

export class ChangeSubTypeCommand implements ICommand {
  constructor(
    public readonly studentId: string,
    public readonly targetSubType: string,
    public readonly userId: string,
  ) {}
}
