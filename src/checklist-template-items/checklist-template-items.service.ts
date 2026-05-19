import { Injectable } from '@nestjs/common';
import { ChecklistTemplateItem, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecklistTemplateItemsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ChecklistTemplateItem[]> {
    return this.prisma.checklistTemplateItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string): Promise<ChecklistTemplateItem | null> {
    return this.prisma.checklistTemplateItem.findUnique({ where: { id } });
  }

  create(
    data: Prisma.ChecklistTemplateItemUncheckedCreateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.prisma.checklistTemplateItem.create({ data });
  }

  update(
    id: string,
    data: Prisma.ChecklistTemplateItemUncheckedUpdateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.prisma.checklistTemplateItem.update({ where: { id }, data });
  }

  remove(id: string): Promise<ChecklistTemplateItem> {
    return this.prisma.checklistTemplateItem.delete({ where: { id } });
  }
}
