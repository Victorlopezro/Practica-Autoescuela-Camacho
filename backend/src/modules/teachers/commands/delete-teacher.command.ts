import { ICommand } from '@nestjs/cqrs';

export class DeleteTeacherCommand implements ICommand {
  constructor(public readonly id: string) {}
}
