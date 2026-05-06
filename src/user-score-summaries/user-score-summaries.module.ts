import { Module } from '@nestjs/common';
import {
  UserScoreSummariesController,
  UserScoreSummariesRepository,
  UserScoreSummariesService,
} from './user-score-summaries.resource';

@Module({
  controllers: [UserScoreSummariesController],
  providers: [UserScoreSummariesService, UserScoreSummariesRepository],
  exports: [UserScoreSummariesService],
})
export class UserScoreSummariesModule {}
