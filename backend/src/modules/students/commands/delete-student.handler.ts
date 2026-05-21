import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { DeleteStudentCommand } from './delete-student.command';

@CommandHandler(DeleteStudentCommand)
export class DeleteStudentHandler implements ICommandHandler<DeleteStudentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteStudentCommand) {
    const { id } = command;

    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } });
      await tx.user.delete({ where: { id: student.userId } });
    });

    return { message: 'Student deleted successfully' };
  }
}
