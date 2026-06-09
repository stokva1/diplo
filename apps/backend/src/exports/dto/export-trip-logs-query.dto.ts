import {IsDateString, IsIn, IsOptional, IsString, IsUUID} from 'class-validator';

export class ExportTripLogsQueryDto {
    @IsString()
    @IsIn(['csv', 'xlsx'])
    format: string;

    @IsDateString()
    @IsOptional()
    from?: string;

    @IsDateString()
    @IsOptional()
    to?: string;

    @IsUUID()
    @IsOptional()
    vehicleId?: string;

    @IsUUID()
    @IsOptional()
    memberId?: string;
}