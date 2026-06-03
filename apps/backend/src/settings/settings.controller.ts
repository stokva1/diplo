import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('organization/settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get()
    findOne(@Req() request: AuthenticatedRequest) {
        return this.settingsService.findOne(request.user);
    }

    @Patch()
    update(
        @Req() request: AuthenticatedRequest,
        @Body() dto: UpdateOrganizationSettingsDto,
    ) {
        return this.settingsService.update(request.user, dto);
    }
}