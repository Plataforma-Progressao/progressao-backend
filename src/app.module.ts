import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { envValidationSchema } from './config/env.validation';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { ProgressionCyclesModule } from './progression-cycles/progression-cycles.module';
import { ActivityEvidencesModule } from './activity-evidences/activity-evidences.module';
import { ActivityStatusHistoryModule } from './activity-status-history/activity-status-history.module';
import { ChecklistTemplateItemsModule } from './checklist-template-items/checklist-template-items.module';
import { UserChecklistItemsModule } from './user-checklist-items/user-checklist-items.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportSnapshotsModule } from './report-snapshots/report-snapshots.module';
import { UserScoreSummariesModule } from './user-score-summaries/user-score-summaries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      cache: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    DashboardModule,
    ActivitiesModule,
    ProgressionCyclesModule,
    ActivityEvidencesModule,
    ActivityStatusHistoryModule,
    ChecklistTemplateItemsModule,
    UserChecklistItemsModule,
    NotificationsModule,
    ReportSnapshotsModule,
    UserScoreSummariesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
