import { Module } from '@nestjs/common';
import { ChecklistTemplateItemsController } from './checklist-template-items.controller';
import { ChecklistTemplateItemsService } from './checklist-template-items.service';

@Module({
  controllers: [ChecklistTemplateItemsController],
  providers: [ChecklistTemplateItemsService],
  exports: [ChecklistTemplateItemsService],
})
export class ChecklistTemplateItemsModule {}
