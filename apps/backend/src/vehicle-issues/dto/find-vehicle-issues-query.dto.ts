import {IsDateString, IsIn, IsInt, IsOptional, IsUUID, Max, Min} from 'class-validator';
import {Type} from "class-transformer";

export class FindVehicleIssuesQueryDto {
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
    @IsIn(['createdAt', '-createdAt', 'resolvedAt', '-resolvedAt'])
    sort?: string;

    @IsOptional()
    @IsIn(['mine', 'managed', 'all'])
    scope?: string;

    @IsOptional()
    @IsIn(['OPEN', 'RESOLVED'])
    status?: string;

    @IsUUID()
    @IsOptional()
    vehicleId?: string;

    @IsUUID()
    @IsOptional()
    memberId?: string;

    @IsDateString()
    @IsOptional()
    from?: string;

    @IsDateString()
    @IsOptional()
    to?: string;
}