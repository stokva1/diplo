import {
    IsIn,
    IsInt,
    IsOptional,
    IsString, IsUUID, MaxLength,
    Min,
} from 'class-validator';

export class UpdateVehicleDto {
    @IsString()
    @MaxLength(255)
    @IsOptional()
    name?: string;

    @IsString()
    @MaxLength(30)
    @IsOptional()
    licensePlate?: string;

    @IsString()
    @MaxLength(100)
    @IsOptional()
    brand?: string;

    @IsString()
    @MaxLength(100)
    @IsOptional()
    model?: string;

    @IsString()
    @MaxLength(50)
    @IsOptional()
    vin?: string;

    @IsOptional()
    @IsIn(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG', 'CNG', 'OTHER'])
    fuelType?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    currentOdometerKm?: number;

    @IsOptional()
    @IsIn(['ACTIVE', 'UNAVAILABLE'])
    status?: string;

    @IsUUID()
    @IsOptional()
    managerMemberId?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    note?: string;
}