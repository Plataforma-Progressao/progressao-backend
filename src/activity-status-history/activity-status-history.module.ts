import { Module } from '@nestjs/common';
import {
  ActivityStatusHistoryController,
  ActivityStatusHistoryRepository,
  ActivityStatusHistoryService,
} from './activity-status-history.resource';

@Module({
  controllers: [ActivityStatusHistoryController],
  providers: [ActivityStatusHistoryService, ActivityStatusHistoryRepository],
  exports: [ActivityStatusHistoryService],
})
export class ActivityStatusHistoryModule {}
