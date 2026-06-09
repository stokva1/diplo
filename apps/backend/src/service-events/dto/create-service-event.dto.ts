import {IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min} from 'class-validator';

export class CreateServiceEventDto {
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    title: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    description?: string;

    @IsDateString()
    startAt: string;

    @IsDateString()
    endAt: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    cost?: number;

    @IsUUID()
    @IsOptional()
    invoiceFileId?: string;
}