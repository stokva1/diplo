import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) {}

    @Post()
    create(
        @Req() request: AuthenticatedRequest,
        @Body() dto: CreateReservationDto,
    ) {
        return this.reservationsService.create(request.user, dto);
    }
}