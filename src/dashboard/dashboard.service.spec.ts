import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardAggregationService } from './dashboard-aggregation.service';
import { DashboardService } from './dashboard.service';
import { UsersService } from '../users/users.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let usersService: jest.Mocked<UsersService>;
  let dashboardAggregationService: jest.Mocked<DashboardAggregationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: UsersService,
          useValue: {
            findDashboardProfileById: jest.fn(),
          },
        },
        {
          provide: DashboardAggregationService,
          useValue: {
            buildHome: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
    usersService = module.get(UsersService);
    dashboardAggregationService = module.get(DashboardAggregationService);
  });

  it('delegates home summary to DashboardAggregationService', async () => {
    const profile = {
      id: 'user-1',
      name: 'Dr. Manuel Rocha',
      careerClass: 'Associado',
      currentLevel: 'IV',
      lastProgressionDate: new Date('2023-01-15'),
    };
    const mockResponse = {
      displayName: 'Dr. Manuel Rocha',
      roleLabel: 'Associado IV',
      summary: 'Boas-vindas, Dr. Manuel Rocha. Suas métricas de progressão estão atualizadas.',
      score: { current: 100, target: 2000 },
      career: {
        currentLevelLabel: 'Associado IV',
        nextLevelLabel: 'Titular I',
        progressPercentage: 5,
        yearsInLevel: 3,
        yearsRequired: 4,
        qualisPublications: 1,
        qualisTarget: 15,
        supervisions: 0,
        supervisionsTarget: 4,
      },
      pillars: [],
      biennium: {
        cycleLabel: 'Ciclo não configurado',
        completionPercentage: 0,
        departmentComparison:
          'Comparativo departamental indisponível no momento.',
      },
      notifications: [],
    };

    usersService.findDashboardProfileById.mockResolvedValue(profile);
    dashboardAggregationService.buildHome.mockResolvedValue(mockResponse);

    const result = await service.getHome('user-1');

    expect(usersService.findDashboardProfileById).toHaveBeenCalledWith('user-1');
    expect(dashboardAggregationService.buildHome).toHaveBeenCalledWith(profile);
    expect(result).toEqual(mockResponse);
  });

  it('throws NotFoundException when user does not exist', async () => {
    usersService.findDashboardProfileById.mockResolvedValue(null);

    await expect(service.getHome('missing-user')).rejects.toThrow(
      NotFoundException,
    );
    expect(dashboardAggregationService.buildHome).not.toHaveBeenCalled();
  });
});
