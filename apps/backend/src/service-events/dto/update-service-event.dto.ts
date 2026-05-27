import {
    IsDateString,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class UpdateServiceEventDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string | null;

    @IsDateString()
    @IsOptional()
    startAt?: string;

    @IsDateString()
    @IsOptional()
    endAt?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    cost?: number | null;

    @IsString()
    @IsOptional()
    invoiceFileId?: string | null;
}