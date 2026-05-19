import { Injectable } from '@nestjs/common';
import { Prisma, UserChecklistItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserChecklistItemsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<UserChecklistItem[]> {
    return this.prisma.userChecklistItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<UserChecklistItem | null> {
    return this.prisma.userChecklistItem.findUnique({ where: { id } });
  }

  create(data: Prisma.UserChecklistItemUncheckedCreateInput): Promise<UserChecklistItem> {
    return this.prisma.userChecklistItem.create({ data });
  }

  update(
    id: string,
    data: Prisma.UserChecklistItemUncheckedUpdateInput,
  ): Promise<UserChecklistItem> {
    return this.prisma.userChecklistItem.update({ where: { id }, data });
  }

  remove(id: string): Promise<UserChecklistItem> {
    return this.prisma.userChecklistItem.delete({ where: { id } });
  }
}
