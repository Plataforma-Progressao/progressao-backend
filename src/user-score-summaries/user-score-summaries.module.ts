import { Module } from '@nestjs/common';
import { UserScoreSummariesController } from './user-score-summaries.controller';
import { UserScoreSummariesService } from './user-score-summaries.service';

@Module({
  controllers: [UserScoreSummariesController],
  providers: [UserScoreSummariesService],
  exports: [UserScoreSummariesService],
})
export class UserScoreSummariesModule {}
