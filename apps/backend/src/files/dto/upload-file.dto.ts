import {IsIn, IsOptional} from 'class-validator';

export class UploadFileDto {
    @IsOptional()
    @IsIn(['FUEL_RECEIPT', 'ISSUE_PHOTO', 'SERVICE_INVOICE', 'OTHER'])
    purpose?: string;
}