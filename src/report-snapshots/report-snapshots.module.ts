import { Module } from '@nestjs/common';
import { ReportSnapshotsService } from './report-snapshots.service';

@Module({
  providers: [ReportSnapshotsService],
  exports: [ReportSnapshotsService],
})
export class ReportSnapshotsModule {}
