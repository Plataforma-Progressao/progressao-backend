import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ActivityEvidence, Prisma } from '@prisma/client';
import { ActivityEvidencesService } from './activity-evidences.service';

@Controller('activity-evidences')
export class ActivityEvidencesController {
  constructor(private readonly service: ActivityEvidencesService) {}

  @Get()
  async findAll(): Promise<ActivityEvidence[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ActivityEvidence | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.ActivityEvidenceUncheckedCreateInput,
  ): Promise<ActivityEvidence> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.ActivityEvidenceUncheckedUpdateInput,
  ): Promise<ActivityEvidence> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ActivityEvidence> {
    return this.service.remove(id);
  }
}
