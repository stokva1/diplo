import {IsBooleanString, IsDateString, IsIn, IsInt, IsOptional, IsUUID, Max, Min} from 'class-validator';
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

    @IsOptional()
    @IsIn(['mine', 'managed', 'all'])
    scope?: string;

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

    @IsBooleanString()
    @IsOptional()
    refueled?: string;
}