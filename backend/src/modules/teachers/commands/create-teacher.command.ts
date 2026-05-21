import { ICommand } from '@nestjs/cqrs';

export class CreateTeacherCommand implements ICommand {
  constructor(
    public readonly username: string,
    public readonly password: string,
    public readonly name: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly vehicleIds?: string[],
  ) {}
}
