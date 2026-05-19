import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Prisma, ReportSnapshot } from '@prisma/client';
import { ReportSnapshotsService } from './report-snapshots.service';

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
