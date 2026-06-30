import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { DashboardService } from './dashboard.service';
import { DashboardHomeDto } from './dto/dashboard-home.dto';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('home')
  async home(@Req() request: AuthenticatedRequest): Promise<DashboardHomeDto> {
    return this.dashboardService.getHome(request.user.sub);
  }
}
