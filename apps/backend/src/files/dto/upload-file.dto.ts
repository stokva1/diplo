import { IsIn, IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
    @IsString()
    @IsOptional()
    @IsIn(['FUEL_RECEIPT', 'ISSUE_PHOTO', 'SERVICE_INVOICE', 'OTHER'])
    purpose?: string;
}