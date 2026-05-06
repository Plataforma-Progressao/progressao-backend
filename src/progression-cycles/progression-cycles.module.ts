import { Module } from '@nestjs/common';
import {
  ProgressionCyclesController,
  ProgressionCyclesRepository,
  ProgressionCyclesService,
} from './progression-cycles.resource';

@Module({
  controllers: [ProgressionCyclesController],
  providers: [ProgressionCyclesService, ProgressionCyclesRepository],
  exports: [ProgressionCyclesService],
})
export class ProgressionCyclesModule {}
