import {IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min} from 'class-validator';
import {Type} from 'class-transformer';

export class FindMembersQueryDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number;

    @IsIn(['name', '-name', 'email', '-email', 'role', '-role', 'status', '-status', 'createdAt', '-createdAt'])
    @IsOptional()
    sort?: string;

    @IsIn(['ACTIVE', 'DISABLED'])
    @IsOptional()
    status?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    search?: string;
}