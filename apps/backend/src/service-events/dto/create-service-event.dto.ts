import {IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min} from 'class-validator';

export class CreateServiceEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
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