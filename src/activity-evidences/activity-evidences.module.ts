import { Module } from '@nestjs/common';
import { ActivityEvidencesService } from './activity-evidences.service';

@Module({
  providers: [ActivityEvidencesService],
  exports: [ActivityEvidencesService],
})
export class ActivityEvidencesModule {}
