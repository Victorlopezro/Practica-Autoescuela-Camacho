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
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto, LogIncidentDto } from './dto';
import { CreateVehicleCommand } from './commands/create-vehicle.command';
import { UpdateVehicleCommand } from './commands/update-vehicle.command';
import { DeleteVehicleCommand } from './commands/delete-vehicle.command';
import { LogIncidentCommand } from './commands/log-incident.command';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller({ path: 'vehicles', version: '1' })
export class VehiclesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Create a new vehicle (admin only)' })
  async create(@Body() dto: CreateVehicleDto) {
    return this.commandBus.execute(
      new CreateVehicleCommand(
        dto.plate,
        dto.type,
        dto.itvExpiry ? new Date(dto.itvExpiry) : undefined,
      ),
    );
  }

  @Get()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'List all vehicles with pagination and filters' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        skip,
        take: Number(limit),
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    const enriched = data.map((vehicle) => ({
      ...vehicle,
      itvWarning: vehicle.itvExpiry
        ? vehicle.itvExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : false,
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
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Get vehicle by ID with incidents' })
  async findOne(@Param('id') id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { incidents: { orderBy: { date: 'desc' } } },
    });

    if (!vehicle) {
      return null;
    }

    return {
      ...vehicle,
      itvWarning: vehicle.itvExpiry
        ? vehicle.itvExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : false,
    };
  }

  @Patch(':id')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Update vehicle (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.commandBus.execute(
      new UpdateVehicleCommand(
        id,
        dto.plate,
        dto.type,
        dto.status,
        dto.itvExpiry ? new Date(dto.itvExpiry) : undefined,
      ),
    );
  }

  @Delete(':id')
  @Roles('admin:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vehicle (admin only)' })
  async remove(@Param('id') id: string) {
    await this.commandBus.execute(new DeleteVehicleCommand(id));
  }

  @Post(':id/incidents')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Log an incident for a vehicle (admin only)' })
  async logIncident(@Param('id') id: string, @Body() dto: LogIncidentDto) {
    return this.commandBus.execute(
      new LogIncidentCommand(id, dto.description, new Date(dto.date)),
    );
  }

  @Get(':id/incidents')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'List incidents for a vehicle' })
  async findIncidents(@Param('id') id: string) {
    return this.prisma.vehicleIncident.findMany({
      where: { vehicleId: id },
      orderBy: { date: 'desc' },
    });
  }
}
