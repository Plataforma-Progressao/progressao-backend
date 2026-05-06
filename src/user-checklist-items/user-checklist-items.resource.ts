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
import { Prisma, UserChecklistItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('user-checklist-items')
export class UserChecklistItemsController {
  constructor(private readonly service: UserChecklistItemsService) {}

  @Get()
  async findAll(): Promise<UserChecklistItem[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserChecklistItem | null> {
    return this.service.findById(id);
  }

  @Post()
  async create(
    @Body() data: Prisma.UserChecklistItemUncheckedCreateInput,
  ): Promise<UserChecklistItem> {
    return this.service.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.UserChecklistItemUncheckedUpdateInput,
  ): Promise<UserChecklistItem> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserChecklistItem> {
    return this.service.remove(id);
  }
}

@Injectable()
export class UserChecklistItemsService {
  constructor(private readonly repository: UserChecklistItemsRepository) {}

  findAll(): Promise<UserChecklistItem[]> {
    return this.repository.findAll();
  }

  findById(id: string): Promise<UserChecklistItem | null> {
    return this.repository.findById(id);
  }

  create(data: Prisma.UserChecklistItemUncheckedCreateInput): Promise<UserChecklistItem> {
    return this.repository.create(data);
  }

  update(
    id: string,
    data: Prisma.UserChecklistItemUncheckedUpdateInput,
  ): Promise<UserChecklistItem> {
    return this.repository.update(id, data);
  }

  remove(id: string): Promise<UserChecklistItem> {
    return this.repository.remove(id);
  }
}

@Injectable()
export class UserChecklistItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<UserChecklistItem[]> {
    return this.prisma.userChecklistItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string): Promise<UserChecklistItem | null> {
    return this.prisma.userChecklistItem.findUnique({ where: { id } });
  }

  create(data: Prisma.UserChecklistItemUncheckedCreateInput): Promise<UserChecklistItem> {
    return this.prisma.userChecklistItem.create({ data });
  }

  update(
    id: string,
    data: Prisma.UserChecklistItemUncheckedUpdateInput,
  ): Promise<UserChecklistItem> {
    return this.prisma.userChecklistItem.update({ where: { id }, data });
  }

  remove(id: string): Promise<UserChecklistItem> {
    return this.prisma.userChecklistItem.delete({ where: { id } });
  }
}
