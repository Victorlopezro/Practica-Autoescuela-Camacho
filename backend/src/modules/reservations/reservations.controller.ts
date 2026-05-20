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
import { CreateReservationDto } from './dto';
import { CreateReservationCommand } from './commands/create-reservation.command';
import { ConfirmReservationCommand } from './commands/confirm-reservation.command';
import { CancelReservationCommand } from './commands/cancel-reservation.command';
import { CompleteReservationCommand } from './commands/complete-reservation.command';
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
  async create(@Body() dto: CreateReservationDto, @CurrentUser() user: JwtPayload) {
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
  @ApiOperation({ summary: 'List all reservations with pagination and filters' })
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
  @ApiOperation({ summary: 'Confirm a reservation (deduct from student balance)' })
  async confirm(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(
      new ConfirmReservationCommand(id, user.sub),
    );
  }

  @Delete(':id')
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({ summary: 'Cancel a reservation (refund if applicable)' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(
      new CancelReservationCommand(id, user.sub),
    );
  }

  @Patch(':id/complete')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Complete a confirmed reservation (admin only)' })
  async complete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(
      new CompleteReservationCommand(id, user.sub),
    );
  }

  @Get('availability')
  @Roles('admin:manage', 'teacher:view', 'student:view')
  @ApiOperation({ summary: 'Get free time slots for a given date and duration' })
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

    const slots = calculateFreeSlots(
      existingReservations,
      date,
      slotDuration,
    );

    return { date, teacherId, slotDuration, slots };
  }
}
