import { Module } from '@nestjs/common';
import {
  ActivityEvidencesController,
  ActivityEvidencesRepository,
  ActivityEvidencesService,
} from './activity-evidences.resource';

@Module({
  controllers: [ActivityEvidencesController],
  providers: [ActivityEvidencesService, ActivityEvidencesRepository],
  exports: [ActivityEvidencesService],
})
export class ActivityEvidencesModule {}
