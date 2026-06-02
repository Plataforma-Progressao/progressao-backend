import { Injectable, NotFoundException } from '@nestjs/common';
import { ChecklistItemStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChecklistHomeDto,
  ChecklistHomeItemDto,
  ChecklistItemStatusCode,
} from './dto/checklist-home.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome(userId: string): Promise<ChecklistHomeDto> {
    const activeCycle = await this.prisma.progressionCycle.findFirst({
      where: { userId, isActive: true },
      orderBy: { startsAt: 'desc' },
      select: { id: true },
    });

    const items = await this.prisma.userChecklistItem.findMany({
      where: {
        userId,
        ...(activeCycle ? { progressionCycleId: activeCycle.id } : {}),
      },
      include: {
        templateItem: {
          select: { title: true, description: true, sortOrder: true },
        },
      },
      orderBy: { templateItem: { sortOrder: 'asc' } },
    });

    const mapped = items.map((item) => this.toHomeItem(item));
    const completed = mapped.filter((item) => item.status === 'COMPLETED').length;
    const attention = mapped.filter((item) => item.status === 'ATTENTION').length;
    const pending = mapped.filter((item) => item.status === 'PENDING').length;
    const total = mapped.length;

    return {
      total,
      completed,
      attention,
      pending,
      completionPercentage:
        total > 0 ? Math.round((completed / total) * 100) : 0,
      items: mapped,
    };
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ): Promise<ChecklistHomeItemDto> {
    const existing = await this.prisma.userChecklistItem.findFirst({
      where: { id: itemId, userId },
      include: {
        templateItem: {
          select: { title: true, description: true, sortOrder: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Item de checklist nao encontrado.');
    }

    const now = new Date();
    const updated = await this.prisma.userChecklistItem.update({
      where: { id: itemId },
      data: {
        status: dto.status as ChecklistItemStatus,
        note: dto.note?.trim() || null,
        submittedAt:
          dto.status === 'COMPLETED'
            ? (existing.submittedAt ?? now)
            : existing.submittedAt,
      },
      include: {
        templateItem: {
          select: { title: true, description: true, sortOrder: true },
        },
      },
    });

    return this.toHomeItem(updated);
  }

  private toHomeItem(item: {
    id: string;
    status: ChecklistItemStatus;
    note: string | null;
    submittedAt: Date | null;
    updatedAt: Date;
    templateItem: { title: string; description: string | null };
  }): ChecklistHomeItemDto {
    return {
      id: item.id,
      title: item.templateItem.title,
      description: item.templateItem.description,
      status: item.status as ChecklistItemStatusCode,
      note: item.note,
      submittedAt: item.submittedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
