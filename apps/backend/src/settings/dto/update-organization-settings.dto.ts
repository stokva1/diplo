import {IsInt, IsOptional, Min} from 'class-validator';

export class UpdateOrganizationSettingsDto {
    @IsInt()
    @Min(1)
    @IsOptional()
    tripLogRetentionMonths?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    issuePhotoRetentionMonths?: number;
}