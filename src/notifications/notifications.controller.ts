import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async findAll(): Promise<Notification[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Notification | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(@Body() data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.NotificationUncheckedUpdateInput,
  ): Promise<Notification> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Notification> {
    return this.service.remove(id);
  }
}
