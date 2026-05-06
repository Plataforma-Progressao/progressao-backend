import { Module } from '@nestjs/common';
import {
  UserChecklistItemsController,
  UserChecklistItemsRepository,
  UserChecklistItemsService,
} from './user-checklist-items.resource';

@Module({
  controllers: [UserChecklistItemsController],
  providers: [UserChecklistItemsService, UserChecklistItemsRepository],
  exports: [UserChecklistItemsService],
})
export class UserChecklistItemsModule {}
