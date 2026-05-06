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
import { ActivityEvidence, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class ActivityEvidencesService {
  constructor(private readonly repository: ActivityEvidencesRepository) {}

  findAll(): Promise<ActivityEvidence[]> {
    return this.repository.findAll();
  }

  findById(id: string): Promise<ActivityEvidence | null> {
    return this.repository.findById(id);
  }

  create(data: Prisma.ActivityEvidenceUncheckedCreateInput): Promise<ActivityEvidence> {
    return this.repository.create(data);
  }

  update(
    id: string,
    data: Prisma.ActivityEvidenceUncheckedUpdateInput,
  ): Promise<ActivityEvidence> {
    return this.repository.update(id, data);
  }

  remove(id: string): Promise<ActivityEvidence> {
    return this.repository.remove(id);
  }
}

@Injectable()
export class ActivityEvidencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ActivityEvidence[]> {
    return this.prisma.activityEvidence.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string): Promise<ActivityEvidence | null> {
    return this.prisma.activityEvidence.findUnique({ where: { id } });
  }

  create(data: Prisma.ActivityEvidenceUncheckedCreateInput): Promise<ActivityEvidence> {
    return this.prisma.activityEvidence.create({ data });
  }

  update(
    id: string,
    data: Prisma.ActivityEvidenceUncheckedUpdateInput,
  ): Promise<ActivityEvidence> {
    return this.prisma.activityEvidence.update({ where: { id }, data });
  }

  remove(id: string): Promise<ActivityEvidence> {
    return this.prisma.activityEvidence.delete({ where: { id } });
  }
}
