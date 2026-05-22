import { ICommand } from '@nestjs/cqrs';

export class UpdateTeacherCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly username?: string,
    public readonly password?: string,
    public readonly name?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly vehicleIds?: string[],
    public readonly doubleSession?: boolean,
  ) {}
}
