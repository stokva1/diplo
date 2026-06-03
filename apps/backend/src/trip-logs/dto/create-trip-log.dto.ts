import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateTripLogIssueDto {
    @IsString()
    @MinLength(1)
    description: string;

    @IsArray()
    @ArrayUnique()
    @IsUUID('4', { each: true })
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

    @IsString()
    @IsOptional()
    refuelingReceiptFileId?: string;

    @IsString()
    @IsOptional()
    note?: string;

    @ValidateNested()
    @Type(() => CreateTripLogIssueDto)
    @IsOptional()
    issue?: CreateTripLogIssueDto;
}