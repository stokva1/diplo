import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [AvailabilityModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}