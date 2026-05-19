import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ActivityStatusHistory, Prisma } from '@prisma/client';
import { ActivityStatusHistoryService } from './activity-status-history.service';

@Controller('activity-status-history')
export class ActivityStatusHistoryController {
  constructor(private readonly service: ActivityStatusHistoryService) {}

  @Get()
  async findAll(): Promise<ActivityStatusHistory[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ActivityStatusHistory | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.ActivityStatusHistoryUncheckedCreateInput,
  ): Promise<ActivityStatusHistory> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.ActivityStatusHistoryUncheckedUpdateInput,
  ): Promise<ActivityStatusHistory> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ActivityStatusHistory> {
    return this.service.remove(id);
  }
}
