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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { CreateUserCommand } from './commands/create-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import { DeleteUserCommand } from './commands/delete-user.command';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(
      new CreateUserCommand(dto.username, dto.password, dto.role, dto.teacherId, user.sub, dto.name, dto.lastName, dto.email, dto.phone),
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: JwtPayload) {
    const [profile, studentRecord] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.sub },
        select: {
          id: true,
          username: true,
          name: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          teacherId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.student.findUnique({
        where: { userId: user.sub },
        select: { id: true },
      }),
    ]);
    return { ...profile!, studentId: studentRecord?.id ?? null };
  }

  @Get()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'List all users (admin only)' })
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: Number(limit),
        select: { id: true, username: true, role: true, teacherId: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  @Get(':id')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, role: true, teacherId: true, createdAt: true, updatedAt: true },
    });
    return user;
  }

  @Patch(':id')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Update user (admin only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new UpdateUserCommand(id, dto.role, dto.teacherId, user.sub, dto.name, dto.lastName, dto.email, dto.phone),
    );
  }

  @Delete(':id')
  @Roles('admin:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (admin only)' })
  async remove(@Param('id') id: string) {
    await this.commandBus.execute(new DeleteUserCommand(id));
  }
}
