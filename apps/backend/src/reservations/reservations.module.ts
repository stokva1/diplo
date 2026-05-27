import {Module} from '@nestjs/common';
import {ReservationsController} from './reservations.controller';
import {ReservationsService} from './reservations.service';
import {AvailabilityModule} from "../availability/availability.module";
import {VehicleIssuesModule} from '../vehicle-issues/vehicle-issues.module';

@Module({
    imports: [AvailabilityModule, VehicleIssuesModule],
    controllers: [ReservationsController],
    providers: [ReservationsService]
})
export class ReservationsModule {
}
