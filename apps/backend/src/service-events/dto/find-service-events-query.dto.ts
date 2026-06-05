import {IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min} from 'class-validator';
import {Type} from "class-transformer";

export class FindServiceEventsQueryDto {
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
    @IsIn(['startAt', '-startAt', 'endAt', '-endAt', 'createdAt', '-createdAt'])
    sort?: string;

    @IsString()
    @IsOptional()
    @IsIn(['managed', 'all'])
    scope?: string;

    @IsUUID()
    @IsOptional()
    vehicleId?: string;

    @IsDateString()
    @IsOptional()
    from?: string;

    @IsDateString()
    @IsOptional()
    to?: string;
}