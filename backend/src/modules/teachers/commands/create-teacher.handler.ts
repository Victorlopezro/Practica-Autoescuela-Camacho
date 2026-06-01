import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../common/services/prisma.service';
import { ScheduleGenerationService } from '../../scheduling-rules/services/schedule-generation.service';
import { CreateTeacherCommand } from './create-teacher.command';

@CommandHandler(CreateTeacherCommand)
export class CreateTeacherHandler implements ICommandHandler<CreateTeacherCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduleGenerationService: ScheduleGenerationService,
  ) {}

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

    // Step 1: Create teacher + user + vehicles in a transaction
    const { teacher, user, vehicles } = await this.prisma.$transaction(async (tx) => {
      const t = await tx.teacher.create({ data: { name } });

      const u = await tx.user.create({
        data: {
          username,
          password: hashed,
          role: 'teacher',
          name,
          lastName,
          email,
          phone,
          teacherId: t.id,
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

      if (vehicleIds?.length) {
        await tx.teacherVehicle.createMany({
          data: vehicleIds.map((vid: string) => ({
            teacherId: t.id,
            vehicleId: vid,
          })),
        });
      }

      const v = vehicleIds?.length
        ? await tx.vehicle.findMany({
            where: { id: { in: vehicleIds } },
            select: { id: true, plate: true },
          })
        : [];

      return { teacher: t, user: u, vehicles: v };
    });

    // Step 2: Apply existing generation rules (outside transaction — uses its own queries)
    let rulesApplied = 0;
    let rowsCreated = 0;
    let rulesSkipped = 0;
    try {
      const genResult =
        await this.scheduleGenerationService.applyExistingRulesToNewTeacher(
          teacher.id,
        );
      rulesApplied = genResult.rulesApplied;
      rowsCreated = genResult.rowsCreated;
      rulesSkipped = genResult.rulesSkipped;
    } catch (error) {
      this.logger.error(
        `Failed to apply generation rules to new teacher ${teacher.id}: ${error}`,
      );
    }

    return {
      ...teacher,
      user,
      vehicles,
      generationRulesApplied: rulesApplied,
      generationRowsCreated: rowsCreated,
      generationRulesSkipped: rulesSkipped,
    };
  }

  private readonly logger = new Logger(CreateTeacherHandler.name);
}
