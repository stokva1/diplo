import {Module} from '@nestjs/common';
import {ReservationsController} from './reservations.controller';
import {ReservationsService} from './reservations.service';
import {AvailabilityModule} from "../availability/availability.module";
import {VehicleIssuesModule} from '../vehicle-issues/vehicle-issues.module';
import {TripLogsService} from "../trip-logs/trip-logs.service";
import {AuditModule} from "../audit/audit.module";

@Module({
    imports: [AvailabilityModule, VehicleIssuesModule, AuditModule],
    controllers: [ReservationsController],
    providers: [ReservationsService, TripLogsService]
})
export class ReservationsModule {
}
