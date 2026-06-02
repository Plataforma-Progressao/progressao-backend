import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, type Response } from 'express';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ActivityChangeLogListDto } from './dto/activity-change-log.dto';
import { ActivityDetailDto } from './dto/activity-detail.dto';
import {
  ListActivitiesResponseDto,
  ActivityListItemDto,
} from './dto/list-activities.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
import { PaginatedActivitiesResponseDto } from './dto/paginated-activities-response.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { EstimateActivityScoreDto } from './dto/estimate-activity-score.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivitiesService } from './activities.service';
import type { UploadedEvidenceFile } from './types/uploaded-evidence-file';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('atividades')
export class ActivitiesReportController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async listActivities(
    @Req() request: AuthenticatedRequest,
  ): Promise<ListActivitiesResponseDto> {
    return this.activitiesService.getRadReport(request.user.sub);
  }
}

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListActivitiesQueryDto,
  ): Promise<PaginatedActivitiesResponseDto> {
    return this.activitiesService.findAllPaginated(request.user.sub, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('estimate')
  async estimateScore(@Body() dto: EstimateActivityScoreDto) {
    return this.activitiesService.estimateScore(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('evidences/:evidenceId/file')
  async downloadEvidence(
    @Req() request: AuthenticatedRequest,
    @Param('evidenceId') evidenceId: string,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.activitiesService.getEvidenceFile(
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

  @UseGuards(JwtAuthGuard)
  @Delete('evidences/:evidenceId')
  @HttpCode(HttpStatus.OK)
  async deleteEvidence(
    @Req() request: AuthenticatedRequest,
    @Param('evidenceId') evidenceId: string,
  ): Promise<{ id: string }> {
    return this.activitiesService.deleteEvidence(request.user.sub, evidenceId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/changes')
  async findChanges(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ActivityChangeLogListDto> {
    return this.activitiesService.findChanges(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ActivityDetailDto> {
    return this.activitiesService.findById(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateActivityDto,
  ): Promise<ActivityListItemDto> {
    return this.activitiesService.create(request.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityListItemDto> {
    return this.activitiesService.update(request.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ id: string }> {
    return this.activitiesService.remove(request.user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':activityId/evidences')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Req() request: AuthenticatedRequest,
    @Param('activityId') activityId: string,
    @UploadedFile() file: UploadedEvidenceFile,
  ) {
    return this.activitiesService.uploadEvidence(
      request.user.sub,
      activityId,
      file,
    );
  }
}
