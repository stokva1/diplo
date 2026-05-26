import { IsDateString } from 'class-validator';

export class AvailableVehiclesQueryDto {
    @IsDateString()
    startAt: string;

    @IsDateString()
    endAt: string;
}