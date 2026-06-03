import {IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';
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

    @IsString()
    @IsOptional()
    @IsIn(['mine', 'managed', 'all'])
    scope?: string;

    @IsString()
    @IsOptional()
    @IsIn(['OPEN', 'RESOLVED'])
    status?: string;

    @IsString()
    @IsOptional()
    vehicleId?: string;

    @IsString()
    @IsOptional()
    memberId?: string;

    @IsDateString()
    @IsOptional()
    from?: string;

    @IsDateString()
    @IsOptional()
    to?: string;
}