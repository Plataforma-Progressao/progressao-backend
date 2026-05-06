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
import { Prisma, ProgressionCycle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class ProgressionCyclesService {
  constructor(private readonly repository: ProgressionCyclesRepository) {}

  findAll(): Promise<ProgressionCycle[]> {
    return this.repository.findAll();
  }

  findById(id: string): Promise<ProgressionCycle | null> {
    return this.repository.findById(id);
  }

  create(data: Prisma.ProgressionCycleUncheckedCreateInput): Promise<ProgressionCycle> {
    return this.repository.create(data);
  }

  update(
    id: string,
    data: Prisma.ProgressionCycleUncheckedUpdateInput,
  ): Promise<ProgressionCycle> {
    return this.repository.update(id, data);
  }

  remove(id: string): Promise<ProgressionCycle> {
    return this.repository.remove(id);
  }
}

@Injectable()
export class ProgressionCyclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ProgressionCycle[]> {
    return this.prisma.progressionCycle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<ProgressionCycle | null> {
    return this.prisma.progressionCycle.findUnique({ where: { id } });
  }

  create(data: Prisma.ProgressionCycleUncheckedCreateInput): Promise<ProgressionCycle> {
    return this.prisma.progressionCycle.create({ data });
  }

  update(
    id: string,
    data: Prisma.ProgressionCycleUncheckedUpdateInput,
  ): Promise<ProgressionCycle> {
    return this.prisma.progressionCycle.update({ where: { id }, data });
  }

  remove(id: string): Promise<ProgressionCycle> {
    return this.prisma.progressionCycle.delete({ where: { id } });
  }
}
