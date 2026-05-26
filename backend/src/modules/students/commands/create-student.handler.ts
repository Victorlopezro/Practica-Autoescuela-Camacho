import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateStudentCommand } from './create-student.command';

@CommandHandler(CreateStudentCommand)
export class CreateStudentHandler implements ICommandHandler<CreateStudentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateStudentCommand) {
    const {
      username,
      password,
      name,
      lastName,
      email,
      phone,
      licenseType,
      teacherId,
      licenseSubType,
    } = command;

    // Check for duplicate username
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) throw new ConflictException('Username already exists');

    // If teacherId provided, validate teacher exists
    if (teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }

    const hashed = await argon2.hash(password);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          password: hashed,
          role: 'student',
          name,
          lastName,
          email,
          phone,
        },
        select: {
          id: true,
          username: true,
          name: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          teacherId: teacherId ?? null,
          licenseType: licenseType ?? null,
          licenseSubType: licenseSubType ?? null,
        },
      });

      return { ...student, user };
    });

    return result;
  }
}
