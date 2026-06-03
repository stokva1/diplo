import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

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

    @IsString()
    @IsOptional()
    vehicleId?: string;

    @IsString()
    @IsOptional()
    memberId?: string;
}