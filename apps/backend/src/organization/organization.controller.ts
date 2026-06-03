import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

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
}