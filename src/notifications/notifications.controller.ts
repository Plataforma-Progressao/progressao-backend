import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Notification } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { PaginatedNotificationsResponseDto } from './dto/paginated-notifications-response.dto';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<PaginatedNotificationsResponseDto> {
    return this.service.findAllForUser(request.user.sub, query);
  }

  @Get('unread-count')
  async unreadCount(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    const count = await this.service.countUnread(request.user.sub);
    return { count };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ updated: number }> {
    return this.service.markAllRead(request.user.sub);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Notification> {
    return this.service.markRead(request.user.sub, id);
  }
}
