import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register-organization')
    registerOrganization(@Body() dto: RegisterOrganizationDto) {
        return this.authService.registerOrganization(dto);
    }
}