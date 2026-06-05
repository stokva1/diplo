import {IsBooleanString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min} from 'class-validator';
import {Type} from "class-transformer";

export class FindVehiclesQueryDto {
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
    @IsIn(['name', '-name', 'licensePlate', '-licensePlate', 'brand', '-brand', 'status', '-status', 'createdAt', '-createdAt'])
    sort?: string;

    @IsOptional()
    @IsIn(['all', 'managed'])
    scope?: string;

    @IsString()
    @IsOptional()
    @IsIn(['ACTIVE', 'UNAVAILABLE', 'ARCHIVED'])
    status?: string;

    @IsUUID()
    @IsOptional()
    managerId?: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsOptional()
    search?: string;

    @IsBooleanString()
    @IsOptional()
    includeArchived?: string;
}