import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { DashboardService } from './dashboard.service';
import { DashboardHomeDto } from './dto/dashboard-home.dto';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('home')
  async home(@Req() request: AuthenticatedRequest): Promise<DashboardHomeDto> {
    return this.dashboardService.getHome(request.user.sub);
  }
}
