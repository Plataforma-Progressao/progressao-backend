import { Module } from '@nestjs/common';
import {
  ReportSnapshotsController,
  ReportSnapshotsRepository,
  ReportSnapshotsService,
} from './report-snapshots.resource';

@Module({
  controllers: [ReportSnapshotsController],
  providers: [ReportSnapshotsService, ReportSnapshotsRepository],
  exports: [ReportSnapshotsService],
})
export class ReportSnapshotsModule {}
