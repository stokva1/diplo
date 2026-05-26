import {IsDateString, IsNotEmpty, IsString, IsUUID} from "class-validator";

export class CreateReservationDto{
    @IsUUID()
    vehicleId: string;

    @IsDateString()
    startAt: string;

    @IsDateString()
    endAt: string;

    @IsString()
    @IsNotEmpty()
    origin: string;

    @IsString()
    @IsNotEmpty()
    destination: string;

    @IsString()
    @IsNotEmpty()
    purpose: string;
}