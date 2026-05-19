import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
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
