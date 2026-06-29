import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import {
  ActivitiesController,
  ActivitiesReportController,
} from './activities.controller';
import { ActivitiesService } from './activities.service';
import { activityEvidenceStorage } from './config/multer-storage';

@Module({
  imports: [
    MulterModule.register({
      storage: activityEvidenceStorage,
    }),
  ],
  controllers: [ActivitiesReportController, ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
