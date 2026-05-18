import { ICommand } from '@nestjs/cqrs';

export class UpdateUserCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly role?: string,
    public readonly teacherId?: string,
    public readonly changedBy?: string,
  ) {}
}
