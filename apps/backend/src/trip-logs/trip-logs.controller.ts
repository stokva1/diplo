import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TripLogsService } from './trip-logs.service';

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

    @Get('missing')
    findMissing(@Req() request: AuthenticatedRequest) {
        return this.tripLogsService.findMissing(request.user);
    }
}