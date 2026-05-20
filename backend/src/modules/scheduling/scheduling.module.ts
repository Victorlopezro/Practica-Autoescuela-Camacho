import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { SchedulingAiService } from './scheduling-ai.service';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulingAiService],
})
export class SchedulingModule {}
