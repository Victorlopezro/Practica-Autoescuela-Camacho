import { ICommand } from '@nestjs/cqrs';

export class DeleteStudentCommand implements ICommand {
  constructor(public readonly id: string) {}
}
