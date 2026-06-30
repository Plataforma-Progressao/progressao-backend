import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ActivityCategory } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BaremaService } from '../barema/barema.service';
import {
  CreateBaremaActivityRuleDto,
  UpdateBaremaActivityRuleDto,
} from '../barema/dto/create-barema-activity-rule.dto';
import { UpdateBaremaCategoryRuleDto } from '../barema/dto/update-barema-category-rule.dto';
import { UpdateBaremaConfigDto } from '../barema/dto/update-barema-config.dto';

@Controller('admin/barema')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminBaremaController {
  constructor(private readonly baremaService: BaremaService) {}

  @Get('config')
  async getConfig() {
    return this.baremaService.getConfigForAdmin();
  }

  @Patch('config')
  async updateConfig(@Body() dto: UpdateBaremaConfigDto) {
    return this.baremaService.updateConfig(dto);
  }

  @Patch('category-rules/:category')
  async updateCategoryRule(
    @Param('category') category: ActivityCategory,
    @Body() dto: UpdateBaremaCategoryRuleDto,
  ) {
    return this.baremaService.updateCategoryRule(category, dto);
  }

  @Get('activity-rules')
  async listActivityRules() {
    return this.baremaService.listActivityRules();
  }

  @Post('activity-rules')
  async createActivityRule(@Body() dto: CreateBaremaActivityRuleDto) {
    return this.baremaService.createActivityRule(dto);
  }

  @Patch('activity-rules/:id')
  async updateActivityRule(
    @Param('id') id: string,
    @Body() dto: UpdateBaremaActivityRuleDto,
  ) {
    return this.baremaService.updateActivityRule(id, dto);
  }

  @Delete('activity-rules/:id')
  @HttpCode(HttpStatus.OK)
  async deleteActivityRule(@Param('id') id: string) {
    return this.baremaService.deleteActivityRule(id);
  }
}
