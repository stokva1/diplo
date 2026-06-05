import {Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards} from '@nestjs/common';
import {Request} from 'express';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {CreateServiceEventDto} from './dto/create-service-event.dto';
import {ServiceEventsService} from './service-events.service';
import {UpdateServiceEventDto} from "./dto/update-service-event.dto";
import {FindServiceEventsQueryDto} from "./dto/find-service-events-query.dto";

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller()
export class ServiceEventsController {
    constructor(private readonly serviceEventsService: ServiceEventsService) {
    }

    @Post('vehicles/:vehicleId/service-events')
    create(
        @Req() request: AuthenticatedRequest,
        @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
        @Body() dto: CreateServiceEventDto,
    ) {
        return this.serviceEventsService.create(request.user, vehicleId, dto);
    }

    @Get('service-events')
    findAll(
        @Req() request: AuthenticatedRequest,
        @Query() query: FindServiceEventsQueryDto,
    ) {
        return this.serviceEventsService.findAll(request.user, query);
    }

    @Get('vehicles/:vehicleId/service-events')
    findByVehicle(
        @Req() request: AuthenticatedRequest,
        @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
        @Query() query: FindServiceEventsQueryDto
    ) {
        return this.serviceEventsService.findByVehicle(request.user, vehicleId, query);
    }

    @Post('service-events/:serviceEventId/cancel')
    cancel(
        @Req() request: AuthenticatedRequest,
        @Param('serviceEventId', new ParseUUIDPipe()) serviceEventId: string,
    ) {
        return this.serviceEventsService.cancel(request.user, serviceEventId);
    }

    @Get('service-events/:serviceEventId')
    findOne(
        @Req() request: AuthenticatedRequest,
        @Param('serviceEventId', new ParseUUIDPipe()) serviceEventId: string,
    ) {
        return this.serviceEventsService.findOne(request.user, serviceEventId);
    }

    @Patch('service-events/:serviceEventId')
    update(
        @Req() request: AuthenticatedRequest,
        @Param('serviceEventId', new ParseUUIDPipe()) serviceEventId: string,
        @Body() dto: UpdateServiceEventDto,
    ) {
        return this.serviceEventsService.update(request.user, serviceEventId, dto);
    }
}