import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { ServiceEventsController } from './service-events.controller';
import { ServiceEventsService } from './service-events.service';

@Module({
  imports: [AvailabilityModule],
  controllers: [ServiceEventsController],
  providers: [ServiceEventsService],
})
export class ServiceEventsModule {}