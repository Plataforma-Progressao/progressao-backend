import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getHome: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(DashboardController);
    dashboardService = module.get(DashboardService);
  });

  it('delegates home summary loading to DashboardService', async () => {
    const mockResponse = {
      displayName: 'Dr. Manuel Rocha',
      roleLabel: 'Associado IV',
      summary: 'Boas-vindas',
      score: { current: 1420, target: 2000 },
      career: {
        currentLevelLabel: 'Associado IV',
        nextLevelLabel: 'Titular I',
        progressPercentage: 73,
        yearsInLevel: 3,
        yearsRequired: 4,
        qualisPublications: 12,
        qualisTarget: 15,
        supervisions: 5,
        supervisionsTarget: 4,
      },
      pillars: [],
      biennium: {
        cycleLabel: '2023 - 2024',
        completionPercentage: 84,
        departmentComparison: 'Voce esta a frente da media.',
      },
      notifications: [],
    };
    dashboardService.getHome.mockResolvedValue(mockResponse);

    const result = await controller.home({
      user: { sub: 'user-123' },
    } as never);

    expect(dashboardService.getHome).toHaveBeenCalledWith('user-123');
    expect(result).toEqual(mockResponse);
  });
});
