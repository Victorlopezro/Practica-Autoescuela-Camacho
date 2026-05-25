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
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { CreateTeacherCommand } from './commands/create-teacher.command';
import { UpdateTeacherCommand } from './commands/update-teacher.command';
import { DeleteTeacherCommand } from './commands/delete-teacher.command';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller({ path: 'teachers', version: '1' })
export class TeachersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles('admin:manage', 'teacher:view', 'student:view')
  @ApiOperation({ summary: 'List all teachers (paginated)' })
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count(),
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
  @ApiOperation({ summary: 'Get teacher by ID with user profile' })
  async findOne(@Param('id') id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const user = await this.prisma.user.findFirst({
      where: { teacherId: id },
      select: {
        id: true,
        username: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    return { ...teacher, user: user ?? null };
  }

  @Get(':id/stats')
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({ summary: 'Get teacher stats (reservations counts)' })
  async getStats(@Param('id') id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const now = new Date();
    const [totalReservations, upcomingReservations, completedReservations] =
      await Promise.all([
        this.prisma.reservation.count({
          where: { teacherId: id },
        }),
        this.prisma.reservation.count({
          where: { teacherId: id, startTime: { gt: now } },
        }),
        this.prisma.reservation.count({
          where: { teacherId: id, status: 'completed' },
        }),
      ]);

    return {
      id: teacher.id,
      name: teacher.name,
      totalReservations,
      upcomingReservations,
      completedReservations,
    };
  }

  @Post()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Create a new teacher (admin only)' })
  async create(@Body() dto: CreateTeacherDto) {
    return this.commandBus.execute(
      new CreateTeacherCommand(
        dto.username,
        dto.password,
        dto.name,
        dto.lastName,
        dto.email,
        dto.phone,
        dto.vehicleIds,
      ),
    );
  }

  @Patch(':id')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Update a teacher (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.commandBus.execute(
      new UpdateTeacherCommand(
        id,
        dto.username,
        dto.password,
        dto.name,
        dto.lastName,
        dto.email,
        dto.phone,
        dto.vehicleIds,
      ),
    );
  }

  @Delete(':id')
  @Roles('admin:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a teacher (admin only)' })
  async remove(@Param('id') id: string) {
    await this.commandBus.execute(new DeleteTeacherCommand(id));
  }
}
