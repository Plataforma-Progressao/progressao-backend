import { Module } from '@nestjs/common';
import { ChecklistTemplateItemsService } from './checklist-template-items.service';

@Module({
  providers: [ChecklistTemplateItemsService],
  exports: [ChecklistTemplateItemsService],
})
export class ChecklistTemplateItemsModule {}
