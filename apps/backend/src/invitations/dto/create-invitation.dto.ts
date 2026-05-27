import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateInvitationDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    name?: string;
}