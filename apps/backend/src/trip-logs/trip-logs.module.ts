import { Module } from '@nestjs/common';
import { TripLogsController } from './trip-logs.controller';
import { TripLogsService } from './trip-logs.service';
import {AuditModule} from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [TripLogsController],
  providers: [TripLogsService]
})
export class TripLogsModule {}
