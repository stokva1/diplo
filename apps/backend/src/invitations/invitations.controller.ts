import {Body, Controller, Get, Param, Post, Query, Req, UseGuards} from '@nestjs/common';
import {Request} from 'express';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {CreateInvitationDto} from './dto/create-invitation.dto';
import {InvitationsService} from './invitations.service';
import {AcceptInvitationDto} from "./dto/accept-invitation.dto";
import {FindInvitationsQueryDto} from "./dto/find-invitations-query.dto";
import {Throttle} from "@nestjs/throttler";

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@Controller('invitations')
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) {
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Req() request: AuthenticatedRequest, @Body() dto: CreateInvitationDto) {
        return this.invitationsService.create(request.user, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Req() request: AuthenticatedRequest,
        @Query() query: FindInvitationsQueryDto,
    ) {
        return this.invitationsService.findAll(request.user, query);
    }

    @Get('accept/:token')
    @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
    findAcceptInfo(@Param('token') token: string) {
        return this.invitationsService.findAcceptInfo(token);
    }

    @Post('accept/:token')
    @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
    accept(
        @Param('token') token: string,
        @Body() dto: AcceptInvitationDto,
    ) {
        return this.invitationsService.accept(token, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':invitationId/resend')
    resend(
        @Req() request: AuthenticatedRequest,
        @Param('invitationId') invitationId: string,
    ) {
        return this.invitationsService.resend(request.user, invitationId);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':invitationId/cancel')
    cancel(
        @Req() request: AuthenticatedRequest,
        @Param('invitationId') invitationId: string,
    ) {
        return this.invitationsService.cancel(request.user, invitationId);
    }


}