import {IsBooleanString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min} from 'class-validator';
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

    @IsOptional()
    @IsIn(['ACTIVE', 'UNAVAILABLE', 'ARCHIVED'])
    status?: string;

    @IsUUID()
    @IsOptional()
    managerId?: string;

    @IsString()
    @MaxLength(100)
    @IsOptional()
    brand?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    search?: string;

    @IsBooleanString()
    @IsOptional()
    includeArchived?: string;
}