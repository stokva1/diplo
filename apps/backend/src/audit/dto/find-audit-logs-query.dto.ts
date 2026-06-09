import {
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    IsString, IsUUID,
    Max, MaxLength,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindAuditLogsQueryDto {
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

    @IsString()
    @IsIn(['createdAt', '-createdAt'])
    @IsOptional()
    sort?: string;

    @IsUUID()
    @IsOptional()
    actorMemberId?: string;

    @IsString()
    @MaxLength(100)
    @IsOptional()
    entityType?: string;

    @IsUUID()
    @IsOptional()
    entityId?: string;

    @IsString()
    @MaxLength(100)
    @IsOptional()
    action?: string;

    @IsDateString()
    @IsOptional()
    from?: string;

    @IsDateString()
    @IsOptional()
    to?: string;
}