import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { BaremaModule } from '../barema/barema.module';
import { EvaluatorController } from './evaluator.controller';
import { EvaluatorDashboardService } from './evaluator-dashboard.service';
import { EvaluatorService } from './evaluator.service';

@Module({
  imports: [ActivitiesModule, BaremaModule],
  controllers: [EvaluatorController],
  providers: [EvaluatorService, EvaluatorDashboardService],
})
export class EvaluatorModule {}
