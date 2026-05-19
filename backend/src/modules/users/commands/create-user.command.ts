import { ICommand } from '@nestjs/cqrs';

export class CreateUserCommand implements ICommand {
  constructor(
    public readonly username: string,
    public readonly password: string,
    public readonly role: string,
    public readonly teacherId?: string,
    public readonly createdBy?: string,
    public readonly name?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly phone?: string,
  ) {}
}
