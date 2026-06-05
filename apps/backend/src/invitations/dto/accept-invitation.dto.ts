import {IsNotEmpty, IsOptional, IsString, MinLength} from 'class-validator';

export class AcceptInvitationDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}