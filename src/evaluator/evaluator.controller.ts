import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, type Response } from 'express';
import { createReadStream } from 'fs';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ActivityDetailDto } from '../activities/dto/activity-detail.dto';
import { EvaluatorService } from './evaluator.service';
import { EvaluatorDashboardService } from './evaluator-dashboard.service';
import { EvaluatorDashboardHomeDto } from './dto/evaluator-dashboard-home.dto';
import { ListEvaluatorActivitiesQueryDto } from './dto/list-evaluator-activities-query.dto';
import { PaginatedEvaluatorActivitiesResponseDto } from './dto/paginated-evaluator-activities-response.dto';
import { RejectActivityDto } from './dto/reject-activity.dto';
import { EvaluatorActivityDetailDto } from './dto/evaluator-activity-detail.dto';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('evaluator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EVALUATOR)
export class EvaluatorController {
  constructor(
    private readonly evaluatorService: EvaluatorService,
    private readonly evaluatorDashboardService: EvaluatorDashboardService,
  ) {}

  @Get('dashboard/home')
  async getDashboardHome(
    @Req() request: AuthenticatedRequest,
  ): Promise<EvaluatorDashboardHomeDto> {
    return this.evaluatorDashboardService.getHome(request.user.sub);
  }

  @Get('activities')
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListEvaluatorActivitiesQueryDto,
  ): Promise<PaginatedEvaluatorActivitiesResponseDto> {
    return this.evaluatorService.findAllPaginated(request.user.sub, query);
  }

  @Get('activities/evidences/:evidenceId/file')
  async downloadEvidence(
    @Req() request: AuthenticatedRequest,
    @Param('evidenceId') evidenceId: string,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.evaluatorService.getEvidenceFileForEvaluator(
      request.user.sub,
      evidenceId,
    );

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.originalName)}"`,
    );

    createReadStream(file.absolutePath).pipe(response);
  }

  @Get('activities/:id')
  async findById(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<EvaluatorActivityDetailDto> {
    return this.evaluatorService.findById(request.user.sub, id);
  }

  @Post('activities/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ActivityDetailDto> {
    return this.evaluatorService.approve(request.user.sub, id);
  }

  @Post('activities/:id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RejectActivityDto,
  ): Promise<ActivityDetailDto> {
    return this.evaluatorService.reject(request.user.sub, id, dto);
  }
}
