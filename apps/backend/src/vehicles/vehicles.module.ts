import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import {AuditModule} from "../audit/audit.module";

@Module({
  imports: [AvailabilityModule, AuditModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}