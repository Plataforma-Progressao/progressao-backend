import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { EvaluatorController } from './evaluator.controller';
import { EvaluatorDashboardService } from './evaluator-dashboard.service';
import { EvaluatorService } from './evaluator.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [EvaluatorController],
  providers: [EvaluatorService, EvaluatorDashboardService],
})
export class EvaluatorModule {}
