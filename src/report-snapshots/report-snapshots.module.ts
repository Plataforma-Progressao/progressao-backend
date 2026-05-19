import { Module } from '@nestjs/common';
import { ReportSnapshotsController } from './report-snapshots.controller';
import { ReportSnapshotsService } from './report-snapshots.service';

@Module({
  controllers: [ReportSnapshotsController],
  providers: [ReportSnapshotsService],
  exports: [ReportSnapshotsService],
})
export class ReportSnapshotsModule {}
