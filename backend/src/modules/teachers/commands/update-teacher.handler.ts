import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../common/services/prisma.service';
import { UpdateTeacherCommand } from './update-teacher.command';

@CommandHandler(UpdateTeacherCommand)
export class UpdateTeacherHandler implements ICommandHandler<UpdateTeacherCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateTeacherCommand) {
    const { id, username, password, name, lastName, email, phone, vehicleIds, doubleSession } = command;

    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const user = await this.prisma.user.findFirst({
      where: { teacherId: id },
    });
    if (!user) throw new NotFoundException('Associated user not found');

    // If new username provided, check uniqueness
    if (username !== undefined && username !== user.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username },
      });
      if (existing) throw new ConflictException('Username already exists');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update User fields
      const userData: Record<string, unknown> = {};
      if (username !== undefined) userData.username = username;
      if (password !== undefined) userData.password = await argon2.hash(password);
      if (name !== undefined) userData.name = name;
      if (lastName !== undefined) userData.lastName = lastName;
      if (email !== undefined) userData.email = email;
      if (phone !== undefined) userData.phone = phone;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: userData,
        });
      }

      // Update Teacher name + doubleSession
      const teacherData: Record<string, unknown> = {};
      if (name !== undefined) teacherData.name = name;
      if (doubleSession !== undefined) teacherData.doubleSession = doubleSession;

      if (Object.keys(teacherData).length > 0) {
        await tx.teacher.update({
          where: { id },
          data: teacherData,
        });
      }

      // Replace TeacherVehicle relations if provided
      if (vehicleIds !== undefined) {
        await tx.teacherVehicle.deleteMany({ where: { teacherId: id } });

        if (vehicleIds.length > 0) {
          // Validate vehicles exist
          const vehicles = await tx.vehicle.findMany({
            where: { id: { in: vehicleIds } },
          });
          if (vehicles.length !== vehicleIds.length) {
            throw new NotFoundException('One or more vehicles not found');
          }

          await tx.teacherVehicle.createMany({
            data: vehicleIds.map((vid: string) => ({
              teacherId: id,
              vehicleId: vid,
            })),
          });
        }
      }
    });

    // Fetch updated result
    const updatedTeacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    const updatedUser = await this.prisma.user.findFirst({
      where: { teacherId: id },
      select: {
        id: true, username: true, name: true, lastName: true,
        email: true, phone: true,
      },
    });

    const vehicles = await this.prisma.teacherVehicle.findMany({
      where: { teacherId: id },
      include: {
        vehicle: { select: { id: true, plate: true } },
      },
    });

    return {
      ...updatedTeacher,
      user: updatedUser ?? null,
      vehicles: vehicles.map((tv) => tv.vehicle),
    };
  }
}
