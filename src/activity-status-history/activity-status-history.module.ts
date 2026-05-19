import { Module } from '@nestjs/common';
import { ActivityStatusHistoryController } from './activity-status-history.controller';
import { ActivityStatusHistoryService } from './activity-status-history.service';

@Module({
  controllers: [ActivityStatusHistoryController],
  providers: [ActivityStatusHistoryService],
  exports: [ActivityStatusHistoryService],
})
export class ActivityStatusHistoryModule {}
