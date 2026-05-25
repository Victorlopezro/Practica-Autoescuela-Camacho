import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateTeacherCommand } from './create-teacher.command';

@CommandHandler(CreateTeacherCommand)
export class CreateTeacherHandler implements ICommandHandler<CreateTeacherCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateTeacherCommand) {
    const { username, password, name, lastName, email, phone, vehicleIds } =
      command;

    // Check duplicate username
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) throw new ConflictException('Username already exists');

    // Validate vehicles if provided
    if (vehicleIds?.length) {
      const vehicles = await this.prisma.vehicle.findMany({
        where: { id: { in: vehicleIds } },
      });
      if (vehicles.length !== vehicleIds.length) {
        throw new NotFoundException('One or more vehicles not found');
      }
    }

    const hashed = await argon2.hash(password);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create Teacher first to get the ID
      const teacher = await tx.teacher.create({
        data: { name },
      });

      // Create User with teacherId pointing to Teacher
      const user = await tx.user.create({
        data: {
          username,
          password: hashed,
          role: 'teacher',
          name,
          lastName,
          email,
          phone,
          teacherId: teacher.id,
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

      // Create TeacherVehicle relations
      if (vehicleIds?.length) {
        await tx.teacherVehicle.createMany({
          data: vehicleIds.map((vid: string) => ({
            teacherId: teacher.id,
            vehicleId: vid,
          })),
        });
      }

      // Fetch the vehicles for the response
      const vehicles = vehicleIds?.length
        ? await tx.vehicle.findMany({
            where: { id: { in: vehicleIds } },
            select: { id: true, plate: true },
          })
        : [];

      return { ...teacher, user, vehicles };
    });

    return result;
  }
}
