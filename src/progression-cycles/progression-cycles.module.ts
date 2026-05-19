import { Module } from '@nestjs/common';
import { ProgressionCyclesController } from './progression-cycles.controller';
import { ProgressionCyclesService } from './progression-cycles.service';

@Module({
  controllers: [ProgressionCyclesController],
  providers: [ProgressionCyclesService],
  exports: [ProgressionCyclesService],
})
export class ProgressionCyclesModule {}
