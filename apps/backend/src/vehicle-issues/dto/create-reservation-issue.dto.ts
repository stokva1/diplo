import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReservationIssueDto {
    @IsString()
    @IsNotEmpty()
    description: string;
}