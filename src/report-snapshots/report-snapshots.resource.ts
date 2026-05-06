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
import { Prisma, ReportSnapshot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('report-snapshots')
export class ReportSnapshotsController {
  constructor(private readonly service: ReportSnapshotsService) {}

  @Get()
  async findAll(): Promise<ReportSnapshot[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ReportSnapshot | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.ReportSnapshotUncheckedCreateInput,
  ): Promise<ReportSnapshot> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.ReportSnapshotUncheckedUpdateInput,
  ): Promise<ReportSnapshot> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ReportSnapshot> {
    return this.service.remove(id);
  }
}

@Injectable()
export class ReportSnapshotsService {
  constructor(private readonly repository: ReportSnapshotsRepository) {}

  findAll(): Promise<ReportSnapshot[]> {
    return this.repository.findAll();
  }

  findById(id: string): Promise<ReportSnapshot | null> {
    return this.repository.findById(id);
  }

  create(data: Prisma.ReportSnapshotUncheckedCreateInput): Promise<ReportSnapshot> {
    return this.repository.create(data);
  }

  update(
    id: string,
    data: Prisma.ReportSnapshotUncheckedUpdateInput,
  ): Promise<ReportSnapshot> {
    return this.repository.update(id, data);
  }

  remove(id: string): Promise<ReportSnapshot> {
    return this.repository.remove(id);
  }
}

@Injectable()
export class ReportSnapshotsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ReportSnapshot[]> {
    return this.prisma.reportSnapshot.findMany({
      orderBy: { generatedAt: 'desc' },
    });
  }

  findById(id: string): Promise<ReportSnapshot | null> {
    return this.prisma.reportSnapshot.findUnique({ where: { id } });
  }

  create(data: Prisma.ReportSnapshotUncheckedCreateInput): Promise<ReportSnapshot> {
    return this.prisma.reportSnapshot.create({ data });
  }

  update(
    id: string,
    data: Prisma.ReportSnapshotUncheckedUpdateInput,
  ): Promise<ReportSnapshot> {
    return this.prisma.reportSnapshot.update({ where: { id }, data });
  }

  remove(id: string): Promise<ReportSnapshot> {
    return this.prisma.reportSnapshot.delete({ where: { id } });
  }
}
