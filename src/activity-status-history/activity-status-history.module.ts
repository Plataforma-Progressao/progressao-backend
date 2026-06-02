import { Module } from '@nestjs/common';
import { ActivityStatusHistoryService } from './activity-status-history.service';

@Module({
  providers: [ActivityStatusHistoryService],
  exports: [ActivityStatusHistoryService],
})
export class ActivityStatusHistoryModule {}
