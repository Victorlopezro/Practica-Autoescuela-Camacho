import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { DeductClassDto } from './dto/deduct-class.dto';
import { RefillClassDto } from './dto/refill-class.dto';
import { AdjustBalanceCommand } from './commands/adjust-balance.command';
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

  @Get(':id')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Get student by ID with user info and balance' })
  async findOne(@Param('id') id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
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
  @ApiOperation({ summary: 'Deduct a class (45m=1, 90m=2) from student balance' })
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
}
