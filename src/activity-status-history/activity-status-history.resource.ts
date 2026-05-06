import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ActivityStatusHistory, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('activity-status-history')
export class ActivityStatusHistoryController {
  constructor(private readonly service: ActivityStatusHistoryService) {}

  @Get()
  async findAll(): Promise<ActivityStatusHistory[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ActivityStatusHistory | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.ActivityStatusHistoryUncheckedCreateInput,
  ): Promise<ActivityStatusHistory> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.ActivityStatusHistoryUncheckedUpdateInput,
  ): Promise<ActivityStatusHistory> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ActivityStatusHistory> {
    return this.service.remove(id);
  }
}

@Injectable()
export class ActivityStatusHistoryService {
  constructor(private readonly repository: ActivityStatusHistoryRepository) {}

  findAll(): Promise<ActivityStatusHistory[]> {
    return this.repository.findAll();
  }

  findById(id: string): Promise<ActivityStatusHistory | null> {
    return this.repository.findById(id);
  }

  create(
    data: Prisma.ActivityStatusHistoryUncheckedCreateInput,
  ): Promise<ActivityStatusHistory> {
    return this.repository.create(data);
  }

  update(
    id: string,
    data: Prisma.ActivityStatusHistoryUncheckedUpdateInput,
  ): Promise<ActivityStatusHistory> {
    return this.repository.update(id, data);
  }

  remove(id: string): Promise<ActivityStatusHistory> {
    return this.repository.remove(id);
  }
}

@Injectable()
export class ActivityStatusHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ActivityStatusHistory[]> {
    return this.prisma.activityStatusHistory.findMany({
      orderBy: { changedAt: 'desc' },
    });
  }

  findById(id: string): Promise<ActivityStatusHistory | null> {
    return this.prisma.activityStatusHistory.findUnique({ where: { id } });
  }

  create(
    data: Prisma.ActivityStatusHistoryUncheckedCreateInput,
  ): Promise<ActivityStatusHistory> {
    return this.prisma.activityStatusHistory.create({ data });
  }

  update(
    id: string,
    data: Prisma.ActivityStatusHistoryUncheckedUpdateInput,
  ): Promise<ActivityStatusHistory> {
    return this.prisma.activityStatusHistory.update({ where: { id }, data });
  }

  remove(id: string): Promise<ActivityStatusHistory> {
    return this.prisma.activityStatusHistory.delete({ where: { id } });
  }
}
