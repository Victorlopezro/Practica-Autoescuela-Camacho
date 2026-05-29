import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { SchedulingRulesController } from './scheduling-rules.controller';
import { SchedulingRulesService } from './services/scheduling-rules.service';
import { ScheduleGenerationService } from './services/schedule-generation.service';

@Module({
  imports: [CqrsModule, forwardRef(() => SchedulingModule)],
  controllers: [SchedulingRulesController],
  providers: [SchedulingRulesService, ScheduleGenerationService],
  exports: [SchedulingRulesService, ScheduleGenerationService],
})
export class SchedulingRulesModule {}
