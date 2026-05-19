import { Injectable } from '@nestjs/common';
import { ActivityStatusHistory, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityStatusHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ActivityStatusHistory[]> {
    return this.prisma.activityStatusHistory.findMany({
      orderBy: { changedAt: 'desc' },
    });
  }

  findById(id: string): Promise<ActivityStatusHistory | null> {
    return this.prisma.activityStatusHistory.findUnique({ where: { id } });
  }

  create(
    data: Prisma.ActivityStatusHistoryUncheckedCreateInput,
  ): Promise<ActivityStatusHistory> {
    return this.prisma.activityStatusHistory.create({ data });
  }

  update(
    id: string,
    data: Prisma.ActivityStatusHistoryUncheckedUpdateInput,
  ): Promise<ActivityStatusHistory> {
    return this.prisma.activityStatusHistory.update({ where: { id }, data });
  }

  remove(id: string): Promise<ActivityStatusHistory> {
    return this.prisma.activityStatusHistory.delete({ where: { id } });
  }
}
