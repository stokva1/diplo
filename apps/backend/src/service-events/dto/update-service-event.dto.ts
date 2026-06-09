import {
    IsDateString,
    IsNumber,
    IsOptional,
    IsString, IsUUID, MaxLength,
    Min,
} from 'class-validator';

export class UpdateServiceEventDto {
    @IsString()
    @MaxLength(255)
    @IsOptional()
    title?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsOptional()
    startAt?: string;

    @IsDateString()
    @IsOptional()
    endAt?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    cost?: number;

    @IsUUID()
    @IsOptional()
    invoiceFileId?: string;
}