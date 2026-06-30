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
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PublicUser } from '../common/types/public-user.type';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminService } from './admin.service';
import { AdminDashboardHomeDto } from './dto/admin-dashboard-home.dto';
import { AdminUserListItemDto } from './dto/admin-user-list-item.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { PaginatedAdminUsersResponseDto } from './dto/paginated-admin-users-response.dto';
import { UpdateAdminUserRolesDto } from './dto/update-admin-user-roles.dto';
import {
  AssignEvaluatorDto,
  ListEvaluatorAssignmentsQueryDto,
} from './dto/evaluator-assignment.dto';
import {
  EvaluatorAssignmentListItemDto,
  PaginatedEvaluatorAssignmentsResponseDto,
} from './dto/evaluator-assignment-response.dto';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminDashboardService: AdminDashboardService,
  ) {}

  @Get('dashboard/home')
  async getDashboardHome(
    @Req() request: AuthenticatedRequest,
  ): Promise<AdminDashboardHomeDto> {
    return this.adminDashboardService.getHome(request.user.sub);
  }

  @Get('evaluator-assignments')
  async findAllAssignments(
    @Query() query: ListEvaluatorAssignmentsQueryDto,
  ): Promise<PaginatedEvaluatorAssignmentsResponseDto> {
    return this.adminService.findAllAssignmentsPaginated(query);
  }

  @Put('evaluator-assignments/:teacherId')
  async assignEvaluator(
    @Req() request: AuthenticatedRequest,
    @Param('teacherId') teacherId: string,
    @Body() dto: AssignEvaluatorDto,
  ): Promise<EvaluatorAssignmentListItemDto> {
    return this.adminService.assignEvaluator(
      request.user.sub,
      teacherId,
      dto,
    );
  }

  @Delete('evaluator-assignments/:teacherId')
  @HttpCode(HttpStatus.OK)
  async unassignEvaluator(
    @Param('teacherId') teacherId: string,
  ): Promise<EvaluatorAssignmentListItemDto> {
    return this.adminService.unassignEvaluator(teacherId);
  }

  @Get('users')
  async findAll(
    @Query() query: ListAdminUsersQueryDto,
  ): Promise<PaginatedAdminUsersResponseDto> {
    return this.adminService.findAllPaginated(query);
  }

  @Get('users/:id')
  async findById(@Param('id') id: string): Promise<AdminUserListItemDto> {
    return this.adminService.findById(id);
  }

  @Post('users')
  async create(@Body() dto: CreateAdminUserDto): Promise<PublicUser> {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id/roles')
  @HttpCode(HttpStatus.OK)
  async updateRoles(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserRolesDto,
  ): Promise<AdminUserListItemDto> {
    return this.adminService.updateRoles(request.user.sub, id, dto);
  }
}
