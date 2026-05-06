import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  findAll(): Promise<Notification[]> {
    return this.repository.findAll();
  }

  findById(id: string): Promise<Notification | null> {
    return this.repository.findById(id);
  }

  create(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
    return this.repository.create(data);
  }

  update(
    id: string,
    data: Prisma.NotificationUncheckedUpdateInput,
  ): Promise<Notification> {
    return this.repository.update(id, data);
  }

  remove(id: string): Promise<Notification> {
    return this.repository.remove(id);
  }
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  create(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  update(
    id: string,
    data: Prisma.NotificationUncheckedUpdateInput,
  ): Promise<Notification> {
    return this.prisma.notification.update({ where: { id }, data });
  }

  remove(id: string): Promise<Notification> {
    return this.prisma.notification.delete({ where: { id } });
  }
}
