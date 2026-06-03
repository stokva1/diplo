import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('me/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    getMe(@Req() request: AuthenticatedRequest) {
        return this.dashboardService.getMe(request.user);
    }

    @Get('vehicles')
    getVehicles(@Req() request: AuthenticatedRequest) {
        return this.dashboardService.getVehicles(request.user);
    }

    @Get('organization')
    getOrganization(@Req() request: AuthenticatedRequest) {
        return this.dashboardService.getOrganization(request.user);
    }
}