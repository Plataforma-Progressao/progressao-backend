import { Module } from '@nestjs/common';
import { ProgressionCyclesService } from './progression-cycles.service';

@Module({
  providers: [ProgressionCyclesService],
  exports: [ProgressionCyclesService],
})
export class ProgressionCyclesModule {}
