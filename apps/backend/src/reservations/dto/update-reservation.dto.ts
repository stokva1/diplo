import {IsDateString, IsOptional, IsString, IsUUID, MaxLength} from 'class-validator';

export class UpdateReservationDto {
    @IsUUID()
    @IsOptional()
    vehicleId?: string;

    @IsDateString()
    @IsOptional()
    startAt?: string;

    @IsDateString()
    @IsOptional()
    endAt?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    origin?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    destination?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    purpose?: string;
}