import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString, IsUUID, MaxLength,
    Min,
} from 'class-validator';

export class CreateVehicleDto {
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    name: string;

    @IsString()
    @MaxLength(30)
    @IsNotEmpty()
    licensePlate: string;

    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    brand: string;

    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    model: string;

    @IsString()
    @MaxLength(50)
    @IsOptional()
    vin?: string;

    @IsString()
    @IsIn(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG', 'CNG', 'OTHER'])
    fuelType: string;

    @IsInt()
    @Min(0)
    currentOdometerKm: number;

    @IsUUID()
    @IsOptional()
    managerMemberId?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    note?: string;
}