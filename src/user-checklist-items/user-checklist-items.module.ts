import { Module } from '@nestjs/common';
import { UserChecklistItemsController } from './user-checklist-items.controller';
import { UserChecklistItemsService } from './user-checklist-items.service';

@Module({
  controllers: [UserChecklistItemsController],
  providers: [UserChecklistItemsService],
  exports: [UserChecklistItemsService],
})
export class UserChecklistItemsModule {}
