import {Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CreateTripLogDto } from '../trip-logs/dto/create-trip-log.dto';
import { CreateReservationIssueDto } from '../vehicle-issues/dto/create-reservation-issue.dto';
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

    @Get()
    findAll(
        @Req() request: AuthenticatedRequest,
        @Query('scope') scope?: string,
    ) {
        return this.reservationsService.findAll(request.user, scope);
    }

    @Get(':reservationId/trip-log')
    getTripLog(
        @Req() request: AuthenticatedRequest,
        @Param('reservationId') reservationId: string,
    ) {
        return this.reservationsService.getTripLog(request.user, reservationId);
    }

    @Post(':reservationId/trip-log')
    createTripLog(
        @Req() request: AuthenticatedRequest,
        @Param('reservationId') reservationId: string,
        @Body() dto: CreateTripLogDto,
    ) {
        return this.reservationsService.createTripLog(
            request.user,
            reservationId,
            dto,
        );
    }

    @Get(':reservationId')
    findOne(
        @Req() request: AuthenticatedRequest,
        @Param('reservationId') reservationId: string
    ){
        return this.reservationsService.findOne(request.user, reservationId)
    }

    @Post(':reservationId/cancel')
    cancel(
        @Req() request: AuthenticatedRequest,
        @Param('reservationId') reservationId: string,
    ) {
        return this.reservationsService.cancel(request.user, reservationId);
    }

    @Patch(':reservationId')
    update(
        @Req() request: AuthenticatedRequest,
        @Param('reservationId') reservationId: string,
        @Body() dto: UpdateReservationDto,
    ) {
        return this.reservationsService.update(request.user, reservationId, dto);
    }

    @Post(':reservationId/issues')
    createIssue(
        @Req() request: AuthenticatedRequest,
        @Param('reservationId') reservationId: string,
        @Body() dto: CreateReservationIssueDto,
    ) {
        return this.reservationsService.createIssue(
            request.user,
            reservationId,
            dto,
        );
    }

}