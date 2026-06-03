import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTripLogDto {
    @IsInt()
    @Min(0)
    @IsOptional()
    odometerStartKm?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    odometerEndKm?: number;

    @IsBoolean()
    @IsOptional()
    refueled?: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    refuelingCost?: number;

    @IsString()
    @IsOptional()
    refuelingReceiptFileId?: string;

    @IsString()
    @IsOptional()
    note?: string;
}