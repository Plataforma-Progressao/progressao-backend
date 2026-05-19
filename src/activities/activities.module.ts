import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesReportController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  controllers: [ActivitiesReportController, ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
