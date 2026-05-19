import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ChecklistTemplateItem, Prisma } from '@prisma/client';
import { ChecklistTemplateItemsService } from './checklist-template-items.service';

@Controller('checklist-template-items')
export class ChecklistTemplateItemsController {
  constructor(private readonly service: ChecklistTemplateItemsService) {}

  @Get()
  async findAll(): Promise<ChecklistTemplateItem[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ChecklistTemplateItem | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.ChecklistTemplateItemUncheckedCreateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.ChecklistTemplateItemUncheckedUpdateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ChecklistTemplateItem> {
    return this.service.remove(id);
  }
}
