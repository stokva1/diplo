import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
    imports: [DatabaseModule],
    controllers: [ExportsController],
    providers: [ExportsService],
})
export class ExportsModule {}