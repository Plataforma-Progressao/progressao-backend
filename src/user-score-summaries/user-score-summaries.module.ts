import { Module } from '@nestjs/common';
import { UserScoreSummariesService } from './user-score-summaries.service';

@Module({
  providers: [UserScoreSummariesService],
  exports: [UserScoreSummariesService],
})
export class UserScoreSummariesModule {}
