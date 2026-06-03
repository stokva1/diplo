import {
    ArrayUnique,
    IsArray,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

export class CreateReservationIssueDto {
    @IsString()
    @MinLength(1)
    description: string;

    @IsArray()
    @ArrayUnique()
    @IsUUID('4', { each: true })
    @IsOptional()
    photoFileIds?: string[];
}