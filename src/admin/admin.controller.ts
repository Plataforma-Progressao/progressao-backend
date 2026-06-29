import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { AdminService } from './admin.service';
import { AdminUserListItemDto } from './dto/admin-user-list-item.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { PaginatedAdminUsersResponseDto } from './dto/paginated-admin-users-response.dto';
import { UpdateAdminUserRolesDto } from './dto/update-admin-user-roles.dto';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
