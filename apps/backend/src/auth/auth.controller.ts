import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {AcceptInvitationDto} from "./dto/accept-invitation.dto";

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register-organization')
    registerOrganization(@Body() dto: RegisterOrganizationDto) {
        return this.authService.registerOrganization(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() request: AuthenticatedRequest) {
        return this.authService.me(request.user);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    //TODO: Align with API design
    @Post('accept-invitation')
    acceptInvitation(@Body() dto: AcceptInvitationDto) {
        return this.authService.acceptInvitation(dto);
    }
}



