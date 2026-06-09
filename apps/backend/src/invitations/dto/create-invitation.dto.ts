import {IsEmail, IsOptional, IsString, MaxLength} from 'class-validator';

export class CreateInvitationDto {
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    name?: string;
}