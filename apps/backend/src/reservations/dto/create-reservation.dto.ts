import {IsDateString, IsNotEmpty, IsString, IsUUID, MaxLength} from "class-validator";

export class CreateReservationDto {
    @IsUUID()
    vehicleId: string;

    @IsDateString()
    startAt: string;

    @IsDateString()
    endAt: string;

    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    origin: string;

    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    destination: string;

    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    purpose: string;
}