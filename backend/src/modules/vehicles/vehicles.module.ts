import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { VehiclesController } from './vehicles.controller';
import { CreateVehicleHandler } from './commands/create-vehicle.handler';
import { UpdateVehicleHandler } from './commands/update-vehicle.handler';
import { DeleteVehicleHandler } from './commands/delete-vehicle.handler';
import { LogIncidentHandler } from './commands/log-incident.handler';

const handlers = [
  CreateVehicleHandler,
  UpdateVehicleHandler,
  DeleteVehicleHandler,
  LogIncidentHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [VehiclesController],
  providers: [...handlers],
})
export class VehiclesModule {}
