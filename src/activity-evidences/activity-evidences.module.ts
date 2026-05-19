import { Module } from '@nestjs/common';
import { ActivityEvidencesController } from './activity-evidences.controller';
import { ActivityEvidencesService } from './activity-evidences.service';

@Module({
  controllers: [ActivityEvidencesController],
  providers: [ActivityEvidencesService],
  exports: [ActivityEvidencesService],
})
export class ActivityEvidencesModule {}
