import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../database/prisma.service';
import {AvailabilityService} from '../availability/availability.service';
import {CreateVehicleDto} from './dto/create-vehicle.dto';
import {UpdateVehicleDto} from './dto/update-vehicle.dto';
import {AvailableVehiclesQueryDto} from './dto/available-vehicles-query.dto';

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class VehiclesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly availabilityService: AvailabilityService,
    ) {
    }

    async create(currentUser: CurrentUser, dto: CreateVehicleDto) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can create vehicles.');
        }

        const existingVehicleByLicensePlate = await this.prisma.vehicle.findFirst({
            where: {
                organizationId: currentUser.organizationId,
                licensePlate: dto.licensePlate,
            },
        });

        if (existingVehicleByLicensePlate) {
            throw new ConflictException('Vehicle with this license plate already exists.');
        }

        if (dto.vin) {
            const existingVehicleByVin = await this.prisma.vehicle.findFirst({
                where: {
                    organizationId: currentUser.organizationId,
                    vin: dto.vin,
                },
            });

            if (existingVehicleByVin) {
                throw new ConflictException('Vehicle with this VIN already exists.');
            }
        }

        const vehicle = await this.prisma.vehicle.create({
            data: {
                organizationId: currentUser.organizationId,
                managerMembershipId: dto.managerMembershipId,
                name: dto.name,
                licensePlate: dto.licensePlate,
                brand: dto.brand,
                model: dto.model,
                vin: dto.vin,
                fuelType: dto.fuelType,
                currentOdometerKm: dto.currentOdometerKm,
                status: 'ACTIVE',
                note: dto.note,
            },
        });

        return this.toVehicleResponse(vehicle);
    }

    async findAll(currentUser: CurrentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can list vehicles.');
        }

        const vehicles = await this.prisma.vehicle.findMany({
            where: {
                organizationId: currentUser.organizationId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            data: vehicles.map((vehicle) => this.toVehicleResponse(vehicle)),
        };
    }

    private toVehicleResponse(vehicle: any) {
        return {
            id: vehicle.id,
            name: vehicle.name,
            licensePlate: vehicle.licensePlate,
            brand: vehicle.brand,
            model: vehicle.model,
            vin: vehicle.vin,
            fuelType: vehicle.fuelType,
            currentOdometerKm: vehicle.currentOdometerKm,
            status: vehicle.status,
            managerMembershipId: vehicle.managerMembershipId,
            note: vehicle.note,
            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt,
        };
    }

    async findOne(currentUser: CurrentUser, vehicleId: string) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view vehicle detail.');
        }

        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId: currentUser.organizationId,
            },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        return this.toVehicleResponse(vehicle);
    }

    async update(
        currentUser: CurrentUser,
        vehicleId: string,
        dto: UpdateVehicleDto,
    ) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can update vehicles.');
        }

        const existingVehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId: currentUser.organizationId,
            },
        });

        if (!existingVehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        if (
            dto.licensePlate &&
            dto.licensePlate !== existingVehicle.licensePlate
        ) {
            const vehicleWithSameLicensePlate = await this.prisma.vehicle.findFirst({
                where: {
                    organizationId: currentUser.organizationId,
                    licensePlate: dto.licensePlate,
                    NOT: {
                        id: vehicleId,
                    },
                },
            });

            if (vehicleWithSameLicensePlate) {
                throw new ConflictException(
                    'Vehicle with this license plate already exists.',
                );
            }
        }

        if (dto.vin && dto.vin !== existingVehicle.vin) {
            const vehicleWithSameVin = await this.prisma.vehicle.findFirst({
                where: {
                    organizationId: currentUser.organizationId,
                    vin: dto.vin,
                    NOT: {
                        id: vehicleId,
                    },
                },
            });

            if (vehicleWithSameVin) {
                throw new ConflictException('Vehicle with this VIN already exists.');
            }
        }

        const vehicle = await this.prisma.vehicle.update({
            where: {
                id: vehicleId,
            },
            data: {
                name: dto.name,
                licensePlate: dto.licensePlate,
                brand: dto.brand,
                model: dto.model,
                vin: dto.vin,
                fuelType: dto.fuelType,
                currentOdometerKm: dto.currentOdometerKm,
                status: dto.status,
                managerMembershipId: dto.managerMembershipId,
                note: dto.note,
            },
        });

        return this.toVehicleResponse(vehicle);
    }

    async findAvailable(
        currentUser: CurrentUser,
        query: AvailableVehiclesQueryDto,
    ) {
        const startAt = new Date(query.startAt);
        const endAt = new Date(query.endAt);

        const vehicles = await this.availabilityService.findAvailableVehicles(
            currentUser.organizationId,
            startAt,
            endAt,
        );

        return {
            data: vehicles,
        };
    }
}