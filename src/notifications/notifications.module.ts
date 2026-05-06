import { Module } from '@nestjs/common';
import {
  NotificationsController,
  NotificationsRepository,
  NotificationsService,
} from './notifications.resource';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
