import { Module } from '@nestjs/common';
import { BaremaModule } from '../barema/barema.module';
import { UsersModule } from '../users/users.module';
import { AdminBaremaController } from './admin-barema.controller';
import { AdminController } from './admin.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, BaremaModule],
  controllers: [AdminController, AdminBaremaController],
  providers: [AdminService, AdminDashboardService],
})
export class AdminModule {}
