import {IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min} from 'class-validator';
import {Type} from "class-transformer";

export class FindMissingTripLogsQueryDto {
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
    @IsIn(['endAt', '-endAt', 'startAt', '-startAt', 'createdAt', '-createdAt'])
    sort?: string;

    @IsString()
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
}