import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { CostTrackingService } from './cost-tracking.service';

@Module({
  providers: [DatabaseService, CostTrackingService],
  exports: [DatabaseService, CostTrackingService],
})
export class DatabaseModule {}
