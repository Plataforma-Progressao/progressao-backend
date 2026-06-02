import { Test, TestingModule } from '@nestjs/testing';
import {
  ActivityCategory,
  ActivityStatus,
  ChecklistItemStatus,
  NotificationTone,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardAggregationService } from './dashboard-aggregation.service';

describe('DashboardAggregationService', () => {
  let service: DashboardAggregationService;
  let prisma: {
    activity: { findMany: jest.Mock };
    progressionCycle: { findFirst: jest.Mock };
    userChecklistItem: { count: jest.Mock };
    notification: { findMany: jest.Mock };
  };

  const baseUser = {
    id: 'user-1',
    name: 'Dr. Manuel Rocha',
    careerClass: 'Associado',
    currentLevel: 'IV',
    lastProgressionDate: new Date('2023-01-15'),
  };

  beforeEach(async () => {
    prisma = {
      activity: { findMany: jest.fn() },
      progressionCycle: { findFirst: jest.fn() },
      userChecklistItem: { count: jest.fn() },
      notification: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardAggregationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(DashboardAggregationService);

    prisma.activity.findMany.mockResolvedValue([]);
    prisma.progressionCycle.findFirst.mockResolvedValue(null);
    prisma.notification.findMany.mockResolvedValue([]);
  });

  it('returns zeroed score and pillars when user has no approved activities', async () => {
    const result = await service.buildHome(baseUser);

    expect(result.score).toEqual({ current: 0, target: 2000 });
    expect(result.pillars).toHaveLength(4);
    expect(result.pillars.every((pillar) => pillar.score === 0)).toBe(true);
    expect(result.career.qualisPublications).toBe(0);
    expect(result.career.supervisions).toBe(0);
  });

  it('aggregates approved activities by category and computes percentages', async () => {
    prisma.activity.findMany.mockResolvedValue([
      {
        category: ActivityCategory.TEACHING,
        score: 30,
        kind: 'Disciplina',
      },
      {
        category: ActivityCategory.RESEARCH,
        score: 45,
        kind: 'Publicacao Qualis A1',
      },
      {
        category: ActivityCategory.RESEARCH,
        score: 25,
        kind: 'Orientacao de doutorado',
      },
    ]);

    const result = await service.buildHome(baseUser);

    expect(result.score.current).toBe(100);
    expect(result.career.qualisPublications).toBe(1);
    expect(result.career.supervisions).toBe(1);

    const teaching = result.pillars.find((pillar) => pillar.label === 'Ensino');
    const research = result.pillars.find((pillar) => pillar.label === 'Pesquisa');

    expect(teaching).toMatchObject({ score: 30, percentage: 30 });
    expect(research).toMatchObject({ score: 70, percentage: 70 });
  });

  it('ignores non-approved activities via query filter', async () => {
    await service.buildHome(baseUser);

    expect(prisma.activity.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        status: ActivityStatus.APPROVED,
      },
      select: {
        category: true,
        score: true,
        kind: true,
      },
    });
  });

  it('maps notifications with tone and relative timestamp', async () => {
    prisma.notification.findMany.mockResolvedValue([
      {
        title: 'Artigo Validado',
        message: 'Publicacao validada.',
        icon: null,
        tone: NotificationTone.SUCCESS,
        createdAt: new Date('2026-06-01T12:00:00.000Z'),
      },
    ]);

    const result = await service.buildHome({
      ...baseUser,
      lastProgressionDate: null,
    });

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]).toMatchObject({
      title: 'Artigo Validado',
      description: 'Publicacao validada.',
      tone: 'success',
      icon: 'verified',
    });
    expect(result.notifications[0]?.timestamp.length).toBeGreaterThan(0);
  });

  it('uses neutral biennium when there is no active cycle', async () => {
    const result = await service.buildHome(baseUser);

    expect(result.biennium).toEqual({
      cycleLabel: 'Ciclo não configurado',
      completionPercentage: 0,
      departmentComparison:
        'Comparativo departamental indisponível no momento.',
    });
  });

  it('computes biennium completion from checklist items in active cycle', async () => {
    prisma.progressionCycle.findFirst.mockResolvedValue({
      id: 'cycle-1',
      startsAt: new Date('2023-01-01'),
      endsAt: new Date('2024-12-31'),
    });
    prisma.userChecklistItem.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(5);

    const result = await service.buildHome(baseUser);

    expect(result.biennium.cycleLabel).toBe('2023 - 2024');
    expect(result.biennium.completionPercentage).toBe(60);
  });

  it('falls back to score progress when checklist has no items', async () => {
    prisma.progressionCycle.findFirst.mockResolvedValue({
      id: 'cycle-1',
      startsAt: new Date('2023-01-01'),
      endsAt: new Date('2024-12-31'),
    });
    prisma.userChecklistItem.count.mockResolvedValue(0);
    prisma.activity.findMany.mockResolvedValue([
      {
        category: ActivityCategory.TEACHING,
        score: 400,
        kind: null,
      },
    ]);

    const result = await service.buildHome(baseUser);

    expect(result.biennium.completionPercentage).toBe(20);
  });
});
