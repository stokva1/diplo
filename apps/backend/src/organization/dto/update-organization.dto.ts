import {IsEmail, IsOptional, IsString} from 'class-validator';

export class UpdateOrganizationDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    ico?: string | null;

    @IsEmail()
    @IsOptional()
    contactEmail?: string | null;
}