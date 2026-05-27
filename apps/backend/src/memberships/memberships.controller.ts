import {Body, Controller, Get, Param, Patch, Post, Req, UseGuards} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipsService } from './memberships.service';
import {UpdateMembershipDto} from "./dto/update-membership.dto";

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembershipsController {
    constructor(private readonly membershipsService: MembershipsService) {}

    @Get()
    findAll(@Req() request: AuthenticatedRequest) {
        return this.membershipsService.findAll(request.user);
    }

    @Get(':memberId')
    findOne(
        @Req() request: AuthenticatedRequest,
        @Param('memberId') membershipId: string,
    ) {
        return this.membershipsService.findOne(request.user, membershipId);
    }

    @Patch(':memberId')
    update(
        @Req() request: AuthenticatedRequest,
        @Param('membershipId') membershipId: string,
        @Body() dto: UpdateMembershipDto,
    ) {
        return this.membershipsService.update(request.user, membershipId, dto);
    }

    @Post(':memberId/disable')
    disable(
        @Req() request: AuthenticatedRequest,
        @Param('membershipId') membershipId: string,
    ) {
        return this.membershipsService.disable(request.user, membershipId);
    }
}