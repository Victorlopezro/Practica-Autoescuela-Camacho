import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateReservationDto, AdminCancelReservationDto } from './dto';
import { CreateReservationCommand } from './commands/create-reservation.command';
import { ConfirmReservationCommand } from './commands/confirm-reservation.command';
import { CancelReservationCommand } from './commands/cancel-reservation.command';
import { CompleteReservationCommand } from './commands/complete-reservation.command';
import { AdminCancelReservationCommand } from './commands/admin-cancel-reservation.command';
import { calculateFreeSlots } from './reservations-availability.service';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller({ path: 'reservations', version: '1' })
export class ReservationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles('admin:manage', 'student:view')
  @ApiOperation({ summary: 'Create a new reservation' })
  async create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new CreateReservationCommand(
        dto.studentId,
        dto.teacherId,
        dto.vehicleType,
        new Date(dto.startTime),
        dto.duration,
        user.sub,
      ),
    );
  }

  @Get()
  @Roles('admin:manage', 'teacher:view', 'student:view')
  @ApiOperation({
    summary: 'List all reservations with pagination and filters',
  })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('teacherId') teacherId?: string,
    @Query('studentId') studentId?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.ReservationWhereInput = {};
    if (status) where.status = status;
    if (teacherId) where.teacherId = teacherId;
    if (studentId) where.studentId = studentId;

    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        skip,
        take: Number(limit),
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  @Get('calendar')
  @Roles('admin:manage', 'teacher:view', 'student:view')
  @ApiOperation({ summary: 'Get reservations with student/teacher names for calendar views' })
  async getCalendar(
    @Query('teacherId') teacherId?: string,
    @Query('studentId') studentId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const where: Prisma.ReservationWhereInput = {};
    if (teacherId) where.teacherId = teacherId;
    if (studentId) where.studentId = studentId;
    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to) where.startTime.lte = new Date(to);
    }

    const reservations = await this.prisma.reservation.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    // Enrich with student user info and teacher names
    const studentIds = [...new Set(reservations.map((r) => r.studentId))];
    const teacherIds = [...new Set(reservations.map((r) => r.teacherId))];

    const [students, teachers] = await Promise.all([
      this.prisma.student.findMany({
        where: { id: { in: studentIds } },
      }),
      this.prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
      }),
    ]);

    // Get user info for each student (join via student.userId -> user.id)
    const userIds = students.map((s) => s.userId).filter(Boolean);
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, lastName: true, username: true },
        })
      : [];

    const userById = new Map(users.map((u) => [u.id, u]));
    const studentUserMap = new Map<string, { id: string; name: string | null; lastName: string | null; username: string }>();
    for (const s of students) {
      const user = userById.get(s.userId);
      if (user) studentUserMap.set(s.id, user);
    }

    const teacherNameMap = new Map(teachers.map((t) => [t.id, t.name]));

    return reservations.map((r) => ({
      ...r,
      student: r.studentId ? (studentUserMap.get(r.studentId) ?? null) : null,
      teacherName: r.teacherId ? (teacherNameMap.get(r.teacherId) ?? null) : null,
    }));
  }

  @Get(':id')
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({ summary: 'Get reservation by ID' })
  async findOne(@Param('id') id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  @Patch(':id/confirm')
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({
    summary: 'Confirm a reservation (deduct from student balance)',
  })
  async confirm(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(new ConfirmReservationCommand(id, user.sub));
  }

  @Delete(':id')
  @Roles('admin:manage', 'teacher:view', 'student:view')
  @ApiOperation({ summary: 'Cancel a reservation (refund if applicable)' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(new CancelReservationCommand(id, user.sub));
  }

  @Patch(':id/complete')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Complete a confirmed reservation (admin only)' })
  async complete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(
      new CompleteReservationCommand(id, user.sub),
    );
  }

  @Post(':id/admin-cancel')
  @Roles('admin:manage')
  @ApiOperation({
    summary: 'Admin cancel a reservation — bypasses deadline, records reason, refunds if confirmed',
  })
  async adminCancel(
    @Param('id') id: string,
    @Body() dto: AdminCancelReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new AdminCancelReservationCommand(id, user.sub, dto.reason),
    );
  }

  @Get('availability')
  @Roles('admin:manage', 'teacher:view', 'student:view')
  @ApiOperation({
    summary: 'Get free time slots for a given date and duration',
  })
  async getAvailability(
    @Query('date') date: string,
    @Query('teacherId') teacherId: string,
    @Query('duration') duration = '45',
  ) {
    const slotDuration = Number(duration) === 90 ? 90 : 45;

    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        teacherId,
        startTime: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(`${date}T23:59:59.999Z`),
        },
      },
      select: {
        startTime: true,
        duration: true,
        status: true,
      },
    });

    const slots = calculateFreeSlots(existingReservations, date, slotDuration);

    return { date, teacherId, slotDuration, slots };
  }
}
