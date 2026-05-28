import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../common/services/prisma.service';
import { UpdateStudentCommand } from './update-student.command';

@CommandHandler(UpdateStudentCommand)
export class UpdateStudentHandler implements ICommandHandler<UpdateStudentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateStudentCommand) {
    const {
      id,
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

    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');

    const user = await this.prisma.user.findUnique({
      where: { id: student.userId },
    });
    if (!user) throw new NotFoundException('Associated user not found');

    // If new username provided, check uniqueness
    if (username !== undefined && username !== user.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username },
      });
      if (existing) throw new ConflictException('Username already exists');
    }

    // If teacherId provided, validate teacher exists
    if (teacherId !== undefined) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });
      if (!teacher) throw new NotFoundException('Teacher not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update User fields
      const userData: Record<string, unknown> = {};
      if (username !== undefined) userData.username = username;
      if (password !== undefined)
        userData.password = await argon2.hash(password);
      if (name !== undefined) userData.name = name;
      if (lastName !== undefined) userData.lastName = lastName;
      if (email !== undefined) userData.email = email;
      if (phone !== undefined) userData.phone = phone;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: student.userId },
          data: userData,
        });
      }

      // Update Student fields
      const studentData: Record<string, unknown> = {};
      if (licenseType !== undefined) studentData.licenseType = licenseType;
      if (teacherId !== undefined) studentData.teacherId = teacherId;
      if (licenseSubType !== undefined)
        studentData.licenseSubType = licenseSubType;

      if (Object.keys(studentData).length > 0) {
        await tx.student.update({
          where: { id },
          data: studentData,
        });
      }

      // Fetch updated student
      return tx.student.findUnique({
        where: { id },
      });
    });

    // Fetch user info for the response
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: student.userId },
      select: {
        id: true,
        username: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    return { ...result, user: updatedUser ?? null };
  }
}
