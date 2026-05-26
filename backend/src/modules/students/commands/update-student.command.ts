import { ICommand } from '@nestjs/cqrs';

export class UpdateStudentCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly username?: string,
    public readonly password?: string,
    public readonly name?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly licenseType?: string,
    public readonly teacherId?: string,
    public readonly licenseSubType?: 'pista' | 'circulacion',
  ) {}
}
