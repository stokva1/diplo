import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString, MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RegisterOrganizationUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password: string;
}

class RegisterOrganizationOrganizationDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @MaxLength(20)
    @IsOptional()
    ico?: string;

    @IsEmail()
    @MaxLength(255)
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