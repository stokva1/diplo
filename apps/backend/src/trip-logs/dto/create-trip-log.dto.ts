import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsInt, IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID, MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import {Type} from 'class-transformer';

class CreateTripLogIssueDto {
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

export class CreateTripLogDto {
    @IsInt()
    @Min(0)
    odometerStartKm: number;

    @IsInt()
    @Min(0)
    odometerEndKm: number;

    @IsBoolean()
    refueled: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    refuelingCost?: number;

    @IsUUID()
    @IsOptional()
    refuelingReceiptFileId?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    note?: string;

    @ValidateNested()
    @Type(() => CreateTripLogIssueDto)
    @IsOptional()
    issue?: CreateTripLogIssueDto;
}