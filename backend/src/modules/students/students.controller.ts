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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { AdjustBalanceDto, CreateStudentDto, UpdateStudentDto } from './dto';
import { DeductClassDto } from './dto/deduct-class.dto';
import { RefillClassDto } from './dto/refill-class.dto';
import { AdjustBalanceCommand } from './commands/adjust-balance.command';
import { CreateStudentCommand } from './commands/create-student.command';
import { UpdateStudentCommand } from './commands/update-student.command';
import { DeleteStudentCommand } from './commands/delete-student.command';
import { DeductClassCommand } from './commands/deduct-class.command';
import { RefillClassCommand } from './commands/refill-class.command';

@ApiTags('Students')
@ApiBearerAuth()
@Controller({ path: 'students', version: '1' })
export class StudentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({
    summary: 'List students (admin: all; teacher: only assigned)',
  })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @CurrentUser() currentUser: JwtPayload,
    @Query('search') search?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);

    // If teacher, find only their assigned students
    let teacherFilter: { teacherId: string } | undefined;
    if (currentUser.role === 'teacher') {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.sub },
        select: { teacherId: true },
      });
      if (user?.teacherId) {
        teacherFilter = { teacherId: user.teacherId };
      }
    }

    const where = teacherFilter
      ? {
          userId: {
            in: (
              await this.prisma.user.findMany({
                where: teacherFilter,
                select: { id: true },
              })
            ).map((u) => u.id),
          },
        }
      : {};

    if (search) {
      (where as any).user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    // Batch fetch users for profile data
    const userIds = data.map((s) => s.userId);
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              username: true,
              name: true,
              lastName: true,
              email: true,
              phone: true,
            },
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = data.map((student) => ({
      ...student,
      user: userMap.get(student.userId) || null,
    }));

    return {
      data: enriched,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  @Get(':id')
  @Roles('admin:manage', 'teacher:view', 'student:view')
  @ApiOperation({ summary: 'Get student by ID with user info and balance' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });
    if (!student) throw new NotFoundException('Student not found');

    const user = await this.prisma.user.findUnique({
      where: { id: student.userId },
      select: {
        id: true,
        username: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        teacherId: true,
      },
    });

    // Teachers can only view their assigned students
    if (currentUser.role === 'teacher') {
      const teacher = await this.prisma.user.findUnique({
        where: { id: currentUser.sub },
        select: { teacherId: true },
      });
      if (!teacher?.teacherId || user?.teacherId !== teacher.teacherId) {
        throw new NotFoundException('Student not found');
      }
    }

    return { ...student, user: user ?? null };
  }

  @Patch(':id/balance')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Adjust student balance with reason and amount' })
  async adjustBalance(
    @Param('id') id: string,
    @Body() dto: AdjustBalanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new AdjustBalanceCommand(id, dto.amount, dto.reason, user.sub),
    );
  }

  @Post(':id/deduct-class')
  @Roles('admin:manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deduct a class (45m=1, 90m=2) from student balance',
  })
  async deductClass(
    @Param('id') id: string,
    @Body() dto: DeductClassDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new DeductClassCommand(id, dto.duration, user.sub),
    );
  }

  @Post(':id/refill-class')
  @Roles('admin:manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refill/add classes to student balance' })
  async refillClass(
    @Param('id') id: string,
    @Body() dto: RefillClassDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new RefillClassCommand(id, dto.amount, user.sub),
    );
  }

  @Post()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Create a new student (admin only)' })
  async create(@Body() dto: CreateStudentDto) {
    return this.commandBus.execute(
      new CreateStudentCommand(
        dto.username,
        dto.password,
        dto.name,
        dto.lastName,
        dto.email,
        dto.phone,
        dto.licenseType,
        dto.teacherId,
      ),
    );
  }

  @Patch(':id')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Update a student (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.commandBus.execute(
      new UpdateStudentCommand(
        id,
        dto.username,
        dto.password,
        dto.name,
        dto.lastName,
        dto.email,
        dto.phone,
        dto.licenseType,
        dto.teacherId,
      ),
    );
  }

  @Delete(':id')
  @Roles('admin:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student (admin only)' })
  async remove(@Param('id') id: string) {
    await this.commandBus.execute(new DeleteStudentCommand(id));
  }
}
