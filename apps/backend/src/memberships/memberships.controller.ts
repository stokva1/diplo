import {Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipsService } from './memberships.service';
import {UpdateMembershipDto} from "./dto/update-membership.dto";
import {FindMembersQueryDto} from "./dto/find-members-query.dto";

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
    findAll(
        @Req() request: AuthenticatedRequest,
        @Query() query: FindMembersQueryDto,
    ) {
        return this.membershipsService.findAll(request.user, query);
    }

    @Get(':memberId')
    findOne(
        @Req() request: AuthenticatedRequest,
        @Param('memberId', new ParseUUIDPipe()) memberId: string,
    ) {
        return this.membershipsService.findOne(request.user, memberId);
    }

    @Patch(':memberId')
    update(
        @Req() request: AuthenticatedRequest,
        @Param('memberId', new ParseUUIDPipe()) memberId: string,
        @Body() dto: UpdateMembershipDto,
    ) {
        return this.membershipsService.update(request.user, memberId, dto);
    }

    @Post(':memberId/deactivate')
    deactivate(
        @Req() request: AuthenticatedRequest,
        @Param('memberId', new ParseUUIDPipe()) memberId: string,
    ) {
        return this.membershipsService.deactivate(request.user, memberId);
    }
}