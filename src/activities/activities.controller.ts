import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ListActivitiesResponseDto } from './dto/list-activities.dto';
import { ActivitiesService } from './activities.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('atividades')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async listActivities(@Req() request: AuthenticatedRequest): Promise<ListActivitiesResponseDto> {
    return this.activitiesService.listActivities(request.user.sub);
  }
}
