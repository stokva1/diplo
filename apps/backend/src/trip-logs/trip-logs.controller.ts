import {Controller, Get, Param, Query, Req, UseGuards} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TripLogsService } from './trip-logs.service';
import {FindMissingTripLogsQueryDto} from "./dto/find-missing-trip-logs-query.dto";
import {FindTripLogsQueryDto} from "./dto/find-trip-logs-query.dto";

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('trip-logs')
export class TripLogsController {
    constructor(private readonly tripLogsService: TripLogsService) {}

    @Get()
    findAll(
        @Req() request: AuthenticatedRequest,
        @Query() query: FindTripLogsQueryDto,
    ) {
        return this.tripLogsService.findAll(request.user, query);
    }

    @Get('missing')
    findMissing(
        @Req() request: AuthenticatedRequest,
        @Query() query: FindMissingTripLogsQueryDto,
    ) {
        return this.tripLogsService.findMissing(request.user, query);
    }

    @Get(':tripLogId')
    findOne(
        @Req() request: AuthenticatedRequest,
        @Param('tripLogId') tripLogId: string,
    ) {
        return this.tripLogsService.findOne(request.user, tripLogId);
    }
}