import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';

export class FindVehiclesQueryDto {
    @IsString()
    @IsOptional()
    @IsIn(['ACTIVE', 'UNAVAILABLE', 'ARCHIVED'])
    status?: string;

    @IsString()
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