import { Module } from '@nestjs/common';
import { BaremaService } from './barema.service';
import { ScoringEngineService } from './scoring-engine.service';
import { ClassificationService } from './classification.service';
import { CeilingService } from './ceiling.service';
import { OptimizerService } from './optimizer.service';

@Module({
  providers: [
    BaremaService,
    ScoringEngineService,
    ClassificationService,
    CeilingService,
    OptimizerService,
  ],
  exports: [
    BaremaService,
    ScoringEngineService,
    ClassificationService,
    CeilingService,
    OptimizerService,
  ],
})
export class BaremaModule {}
