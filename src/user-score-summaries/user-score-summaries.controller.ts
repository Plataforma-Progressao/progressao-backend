import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Prisma, UserScoreSummary } from '@prisma/client';
import { UserScoreSummariesService } from './user-score-summaries.service';

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
