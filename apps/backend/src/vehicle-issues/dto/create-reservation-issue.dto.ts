import {
    ArrayUnique,
    IsArray, IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID, MaxLength,
} from 'class-validator';

export class CreateReservationIssueDto {
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    description: string;

    @IsArray()
    @ArrayUnique()
    @IsUUID('4', {each: true})
    @IsOptional()
    photoFileIds?: string[];
}