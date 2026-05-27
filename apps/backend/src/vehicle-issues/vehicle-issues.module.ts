import { Module } from '@nestjs/common';
import { VehicleIssuesController } from './vehicle-issues.controller';
import { VehicleIssuesService } from './vehicle-issues.service';

@Module({
  controllers: [VehicleIssuesController],
  providers: [VehicleIssuesService],
  exports: [VehicleIssuesService],
})
export class VehicleIssuesModule {}