import {Body, Controller, Get, Param, Post, Query, Req, UseGuards} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VehicleIssuesService } from './vehicle-issues.service';
import {FindVehicleIssuesQueryDto} from "./dto/find-vehicle-issues-query.dto";

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('issues')
export class VehicleIssuesController {
    constructor(private readonly vehicleIssuesService: VehicleIssuesService) {}

    @Get()
    findAll(
        @Req() request: AuthenticatedRequest,
        @Query() query: FindVehicleIssuesQueryDto,
    ) {
        return this.vehicleIssuesService.findAll(request.user, query);
    }

    @Post(':issueId/resolve')
    resolve(
        @Req() request: AuthenticatedRequest,
        @Param('issueId') issueId: string,
    ) {
        return this.vehicleIssuesService.resolve(request.user, issueId);
    }

    @Get(':issueId')
    findOne(
        @Req() request: AuthenticatedRequest,
        @Param('issueId') issueId: string,
    ) {
        return this.vehicleIssuesService.findOne(request.user, issueId);
    }
}