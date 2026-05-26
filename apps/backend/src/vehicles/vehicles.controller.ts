import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post, Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {Request} from 'express';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {CreateVehicleDto} from './dto/create-vehicle.dto';
import {UpdateVehicleDto} from './dto/update-vehicle.dto';
import {AvailableVehiclesQueryDto} from './dto/available-vehicles-query.dto';
import {VehiclesService} from './vehicles.service';

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) {
    }

    @Post()
    create(@Req() request: AuthenticatedRequest, @Body() dto: CreateVehicleDto) {
        return this.vehiclesService.create(request.user, dto);
    }

    @Get()
    findAll(@Req() request: AuthenticatedRequest) {
        return this.vehiclesService.findAll(request.user);
    }

    @Get('available')
    findAvailable(
        @Req() request: AuthenticatedRequest,
        @Query() query: AvailableVehiclesQueryDto,
    ) {
        return this.vehiclesService.findAvailable(request.user, query);
    }

    @Get(':vehicleId')
    findOne(
        @Req() request: AuthenticatedRequest,
        @Param('vehicleId') vehicleId: string,
    ) {
        return this.vehiclesService.findOne(request.user, vehicleId);
    }

    @Patch(':vehicleId')
    update(
        @Req() request: AuthenticatedRequest,
        @Param('vehicleId') vehicleId: string,
        @Body() dto: UpdateVehicleDto,
    ) {
        return this.vehiclesService.update(request.user, vehicleId, dto);
    }
}