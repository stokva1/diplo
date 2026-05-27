import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateMembershipDto {
    @IsString()
    @IsOptional()
    @IsIn(['ADMIN', 'MEMBER'])
    role?: string;
}