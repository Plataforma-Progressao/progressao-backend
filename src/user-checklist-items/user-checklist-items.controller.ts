import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Prisma, UserChecklistItem } from '@prisma/client';
import { UserChecklistItemsService } from './user-checklist-items.service';

@Controller('user-checklist-items')
export class UserChecklistItemsController {
  constructor(private readonly service: UserChecklistItemsService) {}

  @Get()
  async findAll(): Promise<UserChecklistItem[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserChecklistItem | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.UserChecklistItemUncheckedCreateInput,
  ): Promise<UserChecklistItem> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.UserChecklistItemUncheckedUpdateInput,
  ): Promise<UserChecklistItem> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserChecklistItem> {
    return this.service.remove(id);
  }
}
