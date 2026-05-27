import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';
import {UpdateOrganizationSettingsDto} from "./dto/update-organization-settings.dto";

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('organization')
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}

    @Get()
    findOne(@Req() request: AuthenticatedRequest) {
        return this.organizationService.findOne(request.user);
    }

    @Patch()
    update(
        @Req() request: AuthenticatedRequest,
        @Body() dto: UpdateOrganizationDto,
    ) {
        return this.organizationService.update(request.user, dto);
    }

    @Get('settings')
    findSettings(@Req() request: AuthenticatedRequest) {
        return this.organizationService.findSettings(request.user);
    }

    @Patch('settings')
    updateSettings(
        @Req() request: AuthenticatedRequest,
        @Body() dto: UpdateOrganizationSettingsDto,
    ) {
        return this.organizationService.updateSettings(request.user, dto);
    }
}