import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { SchedulingService } from './scheduling.service';
import { SchedulingAiService, ValidationResult } from './scheduling-ai.service';
import {
  SetAvailabilityDto,
  SetOverrideDto,
  ValidateSlotDto,
} from './dto';

@ApiTags('Scheduling')
@ApiBearerAuth()
@Controller({ path: 'scheduling', version: '1' })
export class SchedulingController {
  constructor(
    private readonly scheduling: SchedulingService,
    private readonly ai: SchedulingAiService,
    private readonly prisma: PrismaService,
  ) {}

  /* ───── Teacher Availability ───── */

  @Get('teachers/:teacherId/availability')
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({ summary: 'Get teacher weekly availability + overrides' })
  async getAvailability(@Param('teacherId') teacherId: string) {
    return this.scheduling.getTeacherAvailability(teacherId);
  }

  @Post('teachers/:teacherId/availability')
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({ summary: 'Set weekly availability for a teacher' })
  async setAvailability(
    @Param('teacherId') teacherId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    await this.scheduling.setAvailability(
      teacherId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );
    return { success: true };
  }

  @Delete('teachers/:teacherId/availability/:dayOfWeek')
  @Roles('admin:manage', 'teacher:view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove weekly availability entry' })
  async removeAvailability(
    @Param('teacherId') teacherId: string,
    @Param('dayOfWeek') dayOfWeek: string,
  ) {
    await this.scheduling.removeAvailability(teacherId, Number(dayOfWeek));
  }

  /* ───── Availability Overrides ───── */

  @Post('teachers/:teacherId/overrides')
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({ summary: 'Set availability override for a specific date' })
  async setOverride(
    @Param('teacherId') teacherId: string,
    @Body() dto: SetOverrideDto,
  ) {
    await this.scheduling.setOverride(
      teacherId,
      dto.date,
      dto.isAvailable,
      dto.startTime,
      dto.endTime,
      dto.reason,
    );
    return { success: true };
  }

  @Delete('teachers/:teacherId/overrides/:date')
  @Roles('admin:manage', 'teacher:view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove availability override' })
  async removeOverride(
    @Param('teacherId') teacherId: string,
    @Param('date') date: string,
  ) {
    await this.scheduling.removeOverride(teacherId, date);
  }

  /* ───── Slot Listing ───── */

  @Get('slots')
  @Roles('admin:manage', 'teacher:view', 'student:view')
  @ApiOperation({ summary: 'Get available slots for a teacher on a date' })
  async getSlots(
    @Query('teacherId') teacherId: string,
    @Query('date') date: string,
    @Query('vehicleType') vehicleType: string,
    @Query('doubleSession') doubleSession?: string,
  ) {
    return this.scheduling.getAvailableSlots(
      teacherId,
      date,
      vehicleType,
      doubleSession === 'true',
    );
  }

  /* ───── AI Validation ───── */

  @Post('validate')
  @Roles('admin:manage', 'teacher:view', 'student:view')
  @ApiOperation({ summary: 'Validate a slot via AI (reglas de negocio)' })
  async validateSlot(@Body() dto: ValidateSlotDto): Promise<ValidationResult> {
    const result = await this.ai.validateSlot({
      teacherId: dto.teacherId,
      studentId: dto.studentId,
      vehicleType: dto.vehicleType,
      startTime: dto.startTime,
      duration: dto.duration,
      doubleSession: dto.doubleSession === 'true',
    });

    return result;
  }

  /* ───── Vehicle Type Config ───── */

  @Get('config/vehicle-types')
  @Roles('admin:manage', 'teacher:view')
  @ApiOperation({ summary: 'Get vehicle type duration config' })
  async getVehicleTypeConfig() {
    return this.prisma.vehicleTypeConfig.findMany({ orderBy: { type: 'asc' } });
  }
}
