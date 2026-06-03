import {
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    Max,
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

    @IsString()
    @IsOptional()
    actorMemberId?: string;

    @IsString()
    @IsOptional()
    entityType?: string;

    @IsString()
    @IsOptional()
    entityId?: string;

    @IsString()
    @IsOptional()
    action?: string;

    @IsDateString()
    @IsOptional()
    from?: string;

    @IsDateString()
    @IsOptional()
    to?: string;
}