import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateReservationDto {
    @IsString()
    @IsOptional()
    vehicleId?: string;

    @IsDateString()
    @IsOptional()
    startAt?: string;

    @IsDateString()
    @IsOptional()
    endAt?: string;

    @IsString()
    @IsOptional()
    origin?: string;

    @IsString()
    @IsOptional()
    destination?: string;

    @IsString()
    @IsOptional()
    purpose?: string;
}