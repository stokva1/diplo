import {IsIn, IsNotEmpty, IsOptional, IsString, MaxLength} from 'class-validator';

export class UpdateMembershipDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    @IsOptional()
    name?: string;


    @IsIn(['ADMIN', 'MEMBER'])
    @IsOptional()
    role?: string;
}