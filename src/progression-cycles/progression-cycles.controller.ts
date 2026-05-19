import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Prisma, ProgressionCycle } from '@prisma/client';
import { ProgressionCyclesService } from './progression-cycles.service';

@Controller('progression-cycles')
export class ProgressionCyclesController {
  constructor(private readonly service: ProgressionCyclesService) {}

  @Get()
  async findAll(): Promise<ProgressionCycle[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProgressionCycle | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.ProgressionCycleUncheckedCreateInput,
  ): Promise<ProgressionCycle> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.ProgressionCycleUncheckedUpdateInput,
  ): Promise<ProgressionCycle> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ProgressionCycle> {
    return this.service.remove(id);
  }
}
