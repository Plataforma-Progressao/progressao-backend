import { Injectable } from '@nestjs/common';
import {
  ActivityCategory,
  ActivityStatus,
  ChecklistItemStatus,
  NotificationTone,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardHomeDto,
  DashboardHomeNotificationDto,
  DashboardHomePillarDto,
  DashboardNotificationTone,
} from './dto/dashboard-home.dto';
import { formatRelativeTimePt } from './utils/format-relative-time-pt';
import { normalizeCareerClass } from './utils/normalize-career-class';

export interface DashboardUserProfile {
  readonly id: string;
  readonly name: string;
  readonly careerClass: string | null;
  readonly currentLevel: string | null;
  readonly lastProgressionDate: Date | null;
}

const SCORE_TARGET = 2000;
const YEARS_REQUIRED = 4;
const QUALIS_TARGET = 15;
const SUPERVISIONS_TARGET = 4;
const DEPARTMENT_COMPARISON_MESSAGE =
  'Comparativo departamental indisponível no momento.';

const PILLAR_DEFINITIONS: readonly {
  category: ActivityCategory;
  label: string;
  accent: string;
}[] = [
  { category: ActivityCategory.TEACHING, label: 'Ensino', accent: '#5a54ea' },
  { category: ActivityCategory.RESEARCH, label: 'Pesquisa', accent: '#14b48b' },
  { category: ActivityCategory.OUTREACH, label: 'Extensão', accent: '#f59e0b' },
  { category: ActivityCategory.MANAGEMENT, label: 'Gestão', accent: '#9ca3af' },
];

@Injectable()
export class DashboardAggregationService {
  constructor(private readonly prisma: PrismaService) {}

  async buildHome(user: DashboardUserProfile): Promise<DashboardHomeDto> {
    const approvedActivities = await this.prisma.activity.findMany({
      where: {
        userId: user.id,
        status: ActivityStatus.APPROVED,
      },
      select: {
        category: true,
        score: true,
        kind: true,
      },
    });

    const pillars = this.buildPillars(approvedActivities);
    const scoreCurrent = pillars.reduce((sum, pillar) => sum + pillar.score, 0);
    const progressPercentage = this.computeProgressPercentage(scoreCurrent);

    const activeCycle = await this.prisma.progressionCycle.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { startsAt: 'desc' },
      select: { id: true, startsAt: true, endsAt: true },
    });

    const biennium = await this.buildBiennium(
      user.id,
      activeCycle,
      progressPercentage,
    );

    const notifications = await this.buildNotifications(user.id);

    const currentLevel = user.currentLevel?.trim().toUpperCase() || 'IV';
    const normalizedCareerClass = normalizeCareerClass(user.careerClass);
    const currentLevelLabel = `${normalizedCareerClass} ${currentLevel}`;
    const nextLevelLabel =
      normalizedCareerClass === 'Titular' ? 'Titular II' : 'Titular I';

    return {
      displayName: user.name,
      roleLabel: currentLevelLabel,
      summary: `Boas-vindas, ${user.name}. Suas métricas de progressão estão atualizadas.`,
      score: {
        current: scoreCurrent,
        target: SCORE_TARGET,
      },
      career: {
        currentLevelLabel,
        nextLevelLabel,
        progressPercentage,
        yearsInLevel: this.computeYearsInLevel(user.lastProgressionDate),
        yearsRequired: YEARS_REQUIRED,
        qualisPublications: this.countQualisPublications(approvedActivities),
        qualisTarget: QUALIS_TARGET,
        supervisions: this.countSupervisions(approvedActivities),
        supervisionsTarget: SUPERVISIONS_TARGET,
      },
      pillars,
      biennium,
      notifications,
    };
  }

  private buildPillars(
    activities: readonly { category: ActivityCategory; score: unknown }[],
  ): DashboardHomePillarDto[] {
    const scoresByCategory = new Map<ActivityCategory, number>();

    for (const activity of activities) {
      const current = scoresByCategory.get(activity.category) ?? 0;
      scoresByCategory.set(
        activity.category,
        current + Number(activity.score),
      );
    }

    const totalScore = PILLAR_DEFINITIONS.reduce(
      (sum, definition) => sum + (scoresByCategory.get(definition.category) ?? 0),
      0,
    );

    return PILLAR_DEFINITIONS.map((definition) => {
      const score = Math.round(
        (scoresByCategory.get(definition.category) ?? 0) * 100,
      ) / 100;
      const percentage =
        totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;

      return {
        label: definition.label,
        score,
        total: score,
        percentage,
        accent: definition.accent,
      };
    });
  }

  private computeProgressPercentage(scoreCurrent: number): number {
    if (SCORE_TARGET <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((scoreCurrent / SCORE_TARGET) * 100));
  }

  private computeYearsInLevel(lastProgressionDate: Date | null): number {
    if (!lastProgressionDate) {
      return 0;
    }

    const now = new Date();
    let years = now.getFullYear() - lastProgressionDate.getFullYear();
    const monthDiff = now.getMonth() - lastProgressionDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getDate() < lastProgressionDate.getDate())
    ) {
      years -= 1;
    }

    return Math.max(0, years);
  }

  private countQualisPublications(
    activities: readonly {
      category: ActivityCategory;
      kind: string | null;
    }[],
  ): number {
    return activities.filter(
      (activity) =>
        activity.category === ActivityCategory.RESEARCH &&
        activity.kind?.toLowerCase().includes('qualis') === true,
    ).length;
  }

  private countSupervisions(
    activities: readonly { kind: string | null }[],
  ): number {
    return activities.filter((activity) =>
      activity.kind?.toLowerCase().includes('orienta'),
    ).length;
  }

  private async buildBiennium(
    userId: string,
    activeCycle: { id: string; startsAt: Date; endsAt: Date } | null,
    scoreProgressPercentage: number,
  ): Promise<DashboardHomeDto['biennium']> {
    if (!activeCycle) {
      return {
        cycleLabel: 'Ciclo não configurado',
        completionPercentage: 0,
        departmentComparison: DEPARTMENT_COMPARISON_MESSAGE,
      };
    }

    const checklistWhere = {
      userId,
      progressionCycleId: activeCycle.id,
    };

    const [completedCount, totalCount] = await Promise.all([
      this.prisma.userChecklistItem.count({
        where: { ...checklistWhere, status: ChecklistItemStatus.COMPLETED },
      }),
      this.prisma.userChecklistItem.count({ where: checklistWhere }),
    ]);

    const completionPercentage =
      totalCount > 0
        ? Math.round((completedCount / totalCount) * 100)
        : scoreProgressPercentage;

    return {
      cycleLabel: this.formatCycleLabel(activeCycle.startsAt, activeCycle.endsAt),
      completionPercentage,
      departmentComparison: DEPARTMENT_COMPARISON_MESSAGE,
    };
  }

  private formatCycleLabel(startsAt: Date, endsAt: Date): string {
    const startYear = startsAt.getUTCFullYear();
    const endYear = endsAt.getUTCFullYear();
    return `${startYear} - ${endYear}`;
  }

  private async buildNotifications(
    userId: string,
  ): Promise<readonly DashboardHomeNotificationDto[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        title: true,
        message: true,
        icon: true,
        tone: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      title: row.title,
      description: row.message,
      timestamp: formatRelativeTimePt(row.createdAt),
      icon: row.icon ?? this.defaultIconForTone(row.tone),
      tone: this.mapNotificationTone(row.tone),
    }));
  }

  private mapNotificationTone(tone: NotificationTone): DashboardNotificationTone {
    switch (tone) {
      case NotificationTone.SUCCESS:
        return 'success';
      case NotificationTone.WARNING:
      case NotificationTone.ERROR:
        return 'warning';
      case NotificationTone.INFO:
      default:
        return 'info';
    }
  }

  private defaultIconForTone(tone: NotificationTone): string {
    switch (tone) {
      case NotificationTone.SUCCESS:
        return 'verified';
      case NotificationTone.WARNING:
      case NotificationTone.ERROR:
        return 'warning_amber';
      case NotificationTone.INFO:
      default:
        return 'info';
    }
  }
}
