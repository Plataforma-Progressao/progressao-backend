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
import { Prisma, UserScoreSummary } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('user-score-summaries')
export class UserScoreSummariesController {
  constructor(private readonly service: UserScoreSummariesService) {}

  @Get()
  async findAll(): Promise<UserScoreSummary[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserScoreSummary | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.UserScoreSummaryUncheckedCreateInput,
  ): Promise<UserScoreSummary> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.UserScoreSummaryUncheckedUpdateInput,
  ): Promise<UserScoreSummary> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserScoreSummary> {
    return this.service.remove(id);
  }
}

@Injectable()
export class UserScoreSummariesService {
  constructor(private readonly repository: UserScoreSummariesRepository) {}

  findAll(): Promise<UserScoreSummary[]> {
    return this.repository.findAll();
  }

  findById(id: string): Promise<UserScoreSummary | null> {
    return this.repository.findById(id);
  }

  create(data: Prisma.UserScoreSummaryUncheckedCreateInput): Promise<UserScoreSummary> {
    return this.repository.create(data);
  }

  update(
    id: string,
    data: Prisma.UserScoreSummaryUncheckedUpdateInput,
  ): Promise<UserScoreSummary> {
    return this.repository.update(id, data);
  }

  remove(id: string): Promise<UserScoreSummary> {
    return this.repository.remove(id);
  }
}

@Injectable()
export class UserScoreSummariesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<UserScoreSummary[]> {
    return this.prisma.userScoreSummary.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: string): Promise<UserScoreSummary | null> {
    return this.prisma.userScoreSummary.findUnique({ where: { id } });
  }

  create(data: Prisma.UserScoreSummaryUncheckedCreateInput): Promise<UserScoreSummary> {
    return this.prisma.userScoreSummary.create({ data });
  }

  update(
    id: string,
    data: Prisma.UserScoreSummaryUncheckedUpdateInput,
  ): Promise<UserScoreSummary> {
    return this.prisma.userScoreSummary.update({ where: { id }, data });
  }

  remove(id: string): Promise<UserScoreSummary> {
    return this.prisma.userScoreSummary.delete({ where: { id } });
  }
}
