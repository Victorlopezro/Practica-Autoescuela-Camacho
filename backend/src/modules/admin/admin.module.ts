import { Module } from '@nestjs/common';
import { AdminPlanningController } from './admin-planning.controller';
import { SchedulingModule } from '../scheduling/scheduling.module';

@Module({
  imports: [SchedulingModule],
  controllers: [AdminPlanningController],
})
export class AdminModule {}
