import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let usersService: jest.Mocked<UsersService>;

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
      ],
    }).compile();

    service = module.get(DashboardService);
    usersService = module.get(UsersService);
  });

  it('builds dashboard home summary from user profile', async () => {
    usersService.findDashboardProfileById.mockResolvedValue({
      id: 'user-1',
      name: 'Dr. Manuel Rocha',
      careerClass: 'Associado',
      currentLevel: 'IV',
    });

    const result = await service.getHome('user-1');

    expect(usersService.findDashboardProfileById).toHaveBeenCalledWith(
      'user-1',
    );
    expect(result.displayName).toBe('Dr. Manuel Rocha');
    expect(result.career.currentLevelLabel).toBe('Associado IV');
    expect(result.notifications.length).toBeGreaterThan(0);
  });

  it('normalizes lowercase titular career class to compute next level', async () => {
    usersService.findDashboardProfileById.mockResolvedValue({
      id: 'user-2',
      name: 'Docente Titular',
      careerClass: 'titular',
      currentLevel: 'i',
    });

    const result = await service.getHome('user-2');

    expect(result.career.currentLevelLabel).toBe('Titular I');
    expect(result.career.nextLevelLabel).toBe('Titular II');
  });

  it('throws NotFoundException when user does not exist', async () => {
    usersService.findDashboardProfileById.mockResolvedValue(null);

    await expect(service.getHome('missing-user')).rejects.toThrow(
      NotFoundException,
    );
  });
});
