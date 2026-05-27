import {
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateTripLogDto {
    @IsInt()
    @Min(0)
    odometerStartKm: number;

    @IsInt()
    @Min(0)
    odometerEndKm: number;

    @IsBoolean()
    refueled: boolean;

    @IsNumber()
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