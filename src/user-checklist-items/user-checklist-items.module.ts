import { Module } from '@nestjs/common';
import { UserChecklistItemsService } from './user-checklist-items.service';

@Module({
  providers: [UserChecklistItemsService],
  exports: [UserChecklistItemsService],
})
export class UserChecklistItemsModule {}
