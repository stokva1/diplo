import {IsBooleanString, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';
import {Type} from "class-transformer";

export class FindTripLogsQueryDto {
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
    @IsIn(['completedAt', '-completedAt', 'createdAt', '-createdAt', 'startAt', '-startAt'])
    sort?: string;

    @IsString()
    @IsOptional()
    @IsIn(['mine', 'managed', 'all'])
    scope?: string;

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

    @IsBooleanString()
    @IsOptional()
    refueled?: string;
}