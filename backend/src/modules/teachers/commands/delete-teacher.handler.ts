import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { DeleteTeacherCommand } from './delete-teacher.command';

@CommandHandler(DeleteTeacherCommand)
export class DeleteTeacherHandler implements ICommandHandler<DeleteTeacherCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteTeacherCommand) {
    const { id } = command;

    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    await this.prisma.$transaction(async (tx) => {
      // Delete TeacherVehicle entries first
      await tx.teacherVehicle.deleteMany({ where: { teacherId: id } });

      // Delete Teacher
      await tx.teacher.delete({ where: { id } });

      // Find and delete User with this teacherId
      const user = await tx.user.findFirst({ where: { teacherId: id } });
      if (user) {
        await tx.user.delete({ where: { id: user.id } });
      }
    });

    return { message: 'Teacher deleted successfully' };
  }
}
