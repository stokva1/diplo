import {IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min} from 'class-validator';

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

    @IsUUID()
    @IsOptional()
    refuelingReceiptFileId?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    note?: string;
}