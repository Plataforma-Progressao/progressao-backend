import { Injectable } from '@nestjs/common';
import { ActivityCategory, NotificationTone } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaremaService } from './barema.service';

export const CEILING_NOTIFICATION_KIND = 'CEILING_REACHED';

export interface CategoryCeilingStatus {
  category: ActivityCategory;
  currentScore: number;
  ceilingScore: number;
  remaining: number;
  atCeiling: boolean;
  nearCeiling: boolean;
}

@Injectable()
export class CeilingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baremaService: BaremaService,
  ) {}

  async getCategoryStatuses(
    userId: string,
    cycleId: string | null,
  ): Promise<CategoryCeilingStatus[]> {
    const config = await this.baremaService.getActiveConfig();
    const scores = await this.aggregateApprovedScores(userId, cycleId);

    return config.categoryRules.map((rule) => {
      const currentScore = scores[rule.category] ?? 0;
      const ceilingScore = Number(rule.ceilingScore);
      const remaining = Math.max(0, ceilingScore - currentScore);
      const ratio = ceilingScore > 0 ? currentScore / ceilingScore : 0;

      return {
        category: rule.category,
        currentScore,
        ceilingScore,
        remaining,
        atCeiling: currentScore >= ceilingScore,
        nearCeiling: ratio >= 0.9 && currentScore < ceilingScore,
      };
    });
  }

  async checkAndNotifyAfterApproval(
    userId: string,
    cycleId: string | null,
    category: ActivityCategory,
  ): Promise<void> {
    const statuses = await this.getCategoryStatuses(userId, cycleId);
    const status = statuses.find((item) => item.category === category);

    if (!status?.atCeiling) {
      return;
    }

    await this.createCeilingNotificationIfNeeded(userId, cycleId, status);
  }

  async checkProjectedCeilingOnCreate(
    userId: string,
    cycleId: string | null,
    category: ActivityCategory,
    projectedScore: number,
  ): Promise<void> {
    const statuses = await this.getCategoryStatuses(userId, cycleId);
    const status = statuses.find((item) => item.category === category);

    if (!status) {
      return;
    }

    const projectedTotal = status.currentScore + projectedScore;
    if (projectedTotal < status.ceilingScore) {
      return;
    }

    await this.createCeilingNotificationIfNeeded(
      userId,
      cycleId,
      {
        ...status,
        currentScore: projectedTotal,
        atCeiling: projectedTotal >= status.ceilingScore,
      },
      true,
    );
  }

  private async createCeilingNotificationIfNeeded(
    userId: string,
    cycleId: string | null,
    status: CategoryCeilingStatus,
    projected = false,
  ): Promise<void> {
    const kindSuffix = cycleId ?? 'global';
    const kind = `${CEILING_NOTIFICATION_KIND}:${status.category}:${kindSuffix}`;

    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        kind,
        isRead: false,
      },
    });

    if (existing) {
      return;
    }

    const categoryLabel = this.formatCategoryLabel(status.category);
    const title = projected
      ? `Projecao de teto em ${categoryLabel}`
      : `Teto atingido em ${categoryLabel}`;

    const message = projected
      ? `A pontuacao projetada em ${categoryLabel} pode ultrapassar o teto de ${status.ceilingScore} pontos.`
      : `Voce atingiu o teto de ${status.ceilingScore} pontos em ${categoryLabel}.`;

    await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        tone: NotificationTone.WARNING,
        icon: 'warning',
        kind,
      },
    });
  }

  private async aggregateApprovedScores(
    userId: string,
    cycleId: string | null,
  ): Promise<Record<ActivityCategory, number>> {
    const where: {
      userId: string;
      status: 'APPROVED';
      progressionCycleId?: string;
    } = {
      userId,
      status: 'APPROVED',
    };

    if (cycleId) {
      where.progressionCycleId = cycleId;
    }

    const grouped = await this.prisma.activity.groupBy({
      by: ['category'],
      where,
      _sum: { score: true },
    });

    const result = {
      [ActivityCategory.TEACHING]: 0,
      [ActivityCategory.RESEARCH]: 0,
      [ActivityCategory.OUTREACH]: 0,
      [ActivityCategory.MANAGEMENT]: 0,
    };

    for (const row of grouped) {
      result[row.category] = Number(row._sum.score ?? 0);
    }

    return result;
  }

  private formatCategoryLabel(category: ActivityCategory): string {
    switch (category) {
      case ActivityCategory.TEACHING:
        return 'Ensino';
      case ActivityCategory.RESEARCH:
        return 'Pesquisa';
      case ActivityCategory.OUTREACH:
        return 'Extensao';
      case ActivityCategory.MANAGEMENT:
        return 'Gestao';
      default:
        return category;
    }
  }
}
