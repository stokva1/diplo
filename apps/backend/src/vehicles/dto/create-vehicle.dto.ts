import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateVehicleDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    licensePlate: string;

    @IsString()
    @IsNotEmpty()
    brand: string;

    @IsString()
    @IsNotEmpty()
    model: string;

    @IsString()
    @IsOptional()
    vin?: string;

    @IsString()
    @IsIn(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG', 'CNG', 'OTHER'])
    fuelType: string;

    @IsInt()
    @Min(0)
    currentOdometerKm: number;

    @IsString()
    @IsOptional()
    managerMemberId?: string;

    @IsString()
    @IsOptional()
    note?: string;
}