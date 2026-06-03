import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {DatabaseModule} from './database/database.module';
import {HealthController} from './health/health.controller';
import {AuthModule} from './auth/auth.module';
import {VehiclesModule} from './vehicles/vehicles.module';
import {AvailabilityModule} from './availability/availability.module';
import {ReservationsModule} from './reservations/reservations.module';
import {TripLogsModule} from './trip-logs/trip-logs.module';
import {VehicleIssuesModule} from './vehicle-issues/vehicle-issues.module';
import {ServiceEventsModule} from './service-events/service-events.module';
import {MembershipsModule} from './memberships/memberships.module';
import {InvitationsModule} from './invitations/invitations.module';
import {OrganizationModule} from './organization/organization.module';
import {FilesModule} from './files/files.module';
import {DashboardModule} from "./dashboard/dashboard.module";
import {SettingsModule} from "./settings/settings.module";
import {ExportsModule} from "./exports/exports.module";
import {AuditModule} from './audit/audit.module';
import {APP_GUARD, APP_INTERCEPTOR} from "@nestjs/core";
import {NoStoreInterceptor} from "./common/interceptors/no-store.interceptor";
import {MeModule} from "./me/me.module";
import {ThrottlerGuard, ThrottlerModule} from "@nestjs/throttler";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60_000,
                limit: 100,
            },
        ]),
        DatabaseModule,
        AuthModule,
        VehiclesModule,
        AvailabilityModule,
        ReservationsModule,
        TripLogsModule,
        VehicleIssuesModule,
        ServiceEventsModule,
        MembershipsModule,
        InvitationsModule,
        OrganizationModule,
        FilesModule,
        MeModule,
        DashboardModule,
        SettingsModule,
        ExportsModule,
        AuditModule,
    ],
    controllers: [AppController, HealthController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: NoStoreInterceptor,
        },
    ],
})
export class AppModule {
}