import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import {AuditModule} from "../audit/audit.module";

@Module({
    imports: [DatabaseModule, AuditModule],
    controllers: [SettingsController],
    providers: [SettingsService],
})
export class SettingsModule {}