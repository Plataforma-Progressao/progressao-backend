import { Injectable, NotFoundException } from '@nestjs/common';
import { DashboardAggregationService } from './dashboard-aggregation.service';
import { DashboardHomeDto } from './dto/dashboard-home.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
    private readonly dashboardAggregationService: DashboardAggregationService,
  ) {}

  async getHome(userId: string): Promise<DashboardHomeDto> {
    const user = await this.usersService.findDashboardProfileById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.dashboardAggregationService.buildHome(user);
  }
}
