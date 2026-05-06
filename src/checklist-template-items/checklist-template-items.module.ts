import { Module } from '@nestjs/common';
import {
  ChecklistTemplateItemsController,
  ChecklistTemplateItemsRepository,
  ChecklistTemplateItemsService,
} from './checklist-template-items.resource';

@Module({
  controllers: [ChecklistTemplateItemsController],
  providers: [ChecklistTemplateItemsService, ChecklistTemplateItemsRepository],
  exports: [ChecklistTemplateItemsService],
})
export class ChecklistTemplateItemsModule {}
