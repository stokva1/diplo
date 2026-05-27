import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationsService } from './invitations.service';

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) {}

    @Post()
    create(@Req() request: AuthenticatedRequest, @Body() dto: CreateInvitationDto) {
        return this.invitationsService.create(request.user, dto);
    }

    @Get()
    findAll(@Req() request: AuthenticatedRequest) {
        return this.invitationsService.findAll(request.user);
    }

    @Post(':invitationId/cancel')
    cancel(
        @Req() request: AuthenticatedRequest,
        @Param('invitationId') invitationId: string,
    ) {
        return this.invitationsService.cancel(request.user, invitationId);
    }
}