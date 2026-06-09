import {IsNotEmpty, IsString, MaxLength} from 'class-validator';

export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    refreshToken: string;
}