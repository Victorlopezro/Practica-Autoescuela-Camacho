import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SchedulingRulesModule } from '../scheduling-rules/scheduling-rules.module';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { SchedulingAiService } from './scheduling-ai.service';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [CqrsModule, forwardRef(() => SchedulingRulesModule)],
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulingAiService, RuleEngineService],
  exports: [SchedulingService, SchedulingAiService, RuleEngineService],
})
export class SchedulingModule {}
