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
import { ChecklistTemplateItem, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('checklist-template-items')
export class ChecklistTemplateItemsController {
  constructor(private readonly service: ChecklistTemplateItemsService) {}

  @Get()
  async findAll(): Promise<ChecklistTemplateItem[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ChecklistTemplateItem | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.ChecklistTemplateItemUncheckedCreateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.ChecklistTemplateItemUncheckedUpdateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ChecklistTemplateItem> {
    return this.service.remove(id);
  }
}

@Injectable()
export class ChecklistTemplateItemsService {
  constructor(private readonly repository: ChecklistTemplateItemsRepository) {}

  findAll(): Promise<ChecklistTemplateItem[]> {
    return this.repository.findAll();
  }

  findById(id: string): Promise<ChecklistTemplateItem | null> {
    return this.repository.findById(id);
  }

  create(
    data: Prisma.ChecklistTemplateItemUncheckedCreateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.repository.create(data);
  }

  update(
    id: string,
    data: Prisma.ChecklistTemplateItemUncheckedUpdateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.repository.update(id, data);
  }

  remove(id: string): Promise<ChecklistTemplateItem> {
    return this.repository.remove(id);
  }
}

@Injectable()
export class ChecklistTemplateItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ChecklistTemplateItem[]> {
    return this.prisma.checklistTemplateItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string): Promise<ChecklistTemplateItem | null> {
    return this.prisma.checklistTemplateItem.findUnique({ where: { id } });
  }

  create(
    data: Prisma.ChecklistTemplateItemUncheckedCreateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.prisma.checklistTemplateItem.create({ data });
  }

  update(
    id: string,
    data: Prisma.ChecklistTemplateItemUncheckedUpdateInput,
  ): Promise<ChecklistTemplateItem> {
    return this.prisma.checklistTemplateItem.update({ where: { id }, data });
  }

  remove(id: string): Promise<ChecklistTemplateItem> {
    return this.prisma.checklistTemplateItem.delete({ where: { id } });
  }
}
