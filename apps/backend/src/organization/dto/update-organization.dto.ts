import {IsEmail, IsOptional, IsString, MaxLength} from 'class-validator';

export class UpdateOrganizationDto {
    @IsString()
    @MaxLength(255)
    @IsOptional()
    name?: string;

    @IsString()
    @MaxLength(20)
    @IsOptional()
    ico?: string | null;

    @IsEmail()
    @MaxLength(255)
    @IsOptional()
    contactEmail?: string | null;
}