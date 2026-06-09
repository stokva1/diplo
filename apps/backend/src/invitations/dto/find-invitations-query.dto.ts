import {IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min} from 'class-validator';
import {Type} from 'class-transformer';

export class FindInvitationsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @IsIn(['createdAt', '-createdAt', 'email', '-email', 'name', '-name', 'expiresAt', '-expiresAt'])
    sort?: string;

    @IsOptional()
    @IsIn(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'])
    status?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    search?: string;
}