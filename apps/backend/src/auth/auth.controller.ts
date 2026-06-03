import {Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {RefreshTokenDto} from "./dto/refresh-token.dto";
import {PasswordResetRequestDto} from "./dto/password-reset-request.dto";
import {PasswordResetConfirmDto} from "./dto/password-reset-confirm.dto";
import {Throttle} from "@nestjs/throttler";

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

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    logout() {
        return this.authService.logout();
    }

    @Post('refresh')
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto);
    }

    @Post('password-reset/request')
    @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } })
    @HttpCode(HttpStatus.NO_CONTENT)
    requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
        return this.authService.requestPasswordReset(dto);
    }

    @Post('password-reset/confirm')
    @HttpCode(HttpStatus.NO_CONTENT)
    confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
        return this.authService.confirmPasswordReset(dto);
    }
}



