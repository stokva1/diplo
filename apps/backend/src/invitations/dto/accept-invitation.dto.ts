import {IsNotEmpty, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

export class AcceptInvitationDto {
    @IsString()
    @MaxLength(255)
    @IsOptional()
    name?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(72)
    password: string;
}