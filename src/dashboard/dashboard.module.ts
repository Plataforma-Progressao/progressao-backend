import { Module } from '@nestjs/common';
import { BaremaModule } from '../barema/barema.module';
import { UsersModule } from '../users/users.module';
import { DashboardAggregationService } from './dashboard-aggregation.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [UsersModule, BaremaModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardAggregationService],
})
export class DashboardModule {}
