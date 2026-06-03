import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MeService } from './me.service';

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
    constructor(private readonly meService: MeService) {}

    @Get()
    getMe(@Req() request: AuthenticatedRequest) {
        return this.meService.getMe(request.user);
    }
}