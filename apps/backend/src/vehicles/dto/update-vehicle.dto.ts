import {
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class UpdateVehicleDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    licensePlate?: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsOptional()
    model?: string;

    @IsString()
    @IsOptional()
    vin?: string | null;

    @IsString()
    @IsOptional()
    @IsIn(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG', 'CNG', 'OTHER'])
    fuelType?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    currentOdometerKm?: number;

    @IsString()
    @IsOptional()
    @IsIn(['ACTIVE', 'UNAVAILABLE'])
    status?: string;

    @IsString()
    @IsOptional()
    managerMembershipId?: string | null;

    @IsString()
    @IsOptional()
    note?: string | null;
}