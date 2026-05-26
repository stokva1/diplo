import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RegisterOrganizationUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;
}

class RegisterOrganizationOrganizationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    ico?: string;

    @IsEmail()
    @IsOptional()
    contactEmail?: string;
}

export class RegisterOrganizationDto {
    @ValidateNested()
    @Type(() => RegisterOrganizationUserDto)
    user: RegisterOrganizationUserDto;

    @ValidateNested()
    @Type(() => RegisterOrganizationOrganizationDto)
    organization: RegisterOrganizationOrganizationDto;
}