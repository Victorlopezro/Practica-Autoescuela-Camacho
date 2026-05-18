import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../common/services/prisma.service';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller({ path: 'teachers', version: '1' })
export class TeachersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({ summary: 'List all teachers (paginated)' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
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
}
