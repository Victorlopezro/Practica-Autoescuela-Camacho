import { ICommand } from '@nestjs/cqrs';

export class UpdateUserCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly role?: string,
    public readonly teacherId?: string,
    public readonly changedBy?: string,
    public readonly name?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly phone?: string,
  ) {}
}
