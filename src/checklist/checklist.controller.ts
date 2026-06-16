import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ChecklistService } from './checklist.service';
import { ChecklistHomeDto, ChecklistHomeItemDto } from './dto/checklist-home.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('checklist')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @UseGuards(JwtAuthGuard)
  @Get('home')
  async getHome(@Req() request: AuthenticatedRequest): Promise<ChecklistHomeDto> {
    return this.checklistService.getHome(request.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:id')
  async updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateChecklistItemDto,
  ): Promise<ChecklistHomeItemDto> {
    return this.checklistService.updateItem(request.user.sub, id, dto);
  }
}
