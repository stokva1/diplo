import {IsIn, IsOptional, IsString, MinLength} from 'class-validator';

export class UpdateMembershipDto {
    @IsString()
    @MinLength(1)
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    @IsIn(['ADMIN', 'MEMBER'])
    role?: string;
}