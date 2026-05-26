import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../database/prisma.service';

@Injectable()
export class AvailabilityService {
    constructor(private readonly prisma: PrismaService) {
    }

    async findAvailableVehicles(
        organizationId: string,
        startAt: Date,
        endAt: Date,
    ) {
        if (endAt <= startAt) {
            throw new BadRequestException('endAt must be after startAt.');
        }

        const vehicles = await this.prisma.vehicle.findMany({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
            orderBy: {
                name: 'asc',
            },
        });

        return vehicles.map((vehicle) => ({
            id: vehicle.id,
            name: vehicle.name,
            licensePlate: vehicle.licensePlate,
            brand: vehicle.brand,
            model: vehicle.model,
        }));
    }

    async assertVehicleAvailableForReservation(
        organizationId: string,
        vehicleId: string,
        startAt: Date,
        endAt: Date,
        ignoredReservationId?: string,
    ) {
        if (endAt <= startAt) {
            throw new BadRequestException('endAt must be after startAt.');
        }

        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId,
            },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        if (vehicle.status !== 'ACTIVE') {
            throw new ConflictException('Vehicle is not active.');
        }

        const reservationCollision = await this.prisma.reservation.findFirst({
            where: {
                vehicleId,
                status: 'ACTIVE',
                ...(ignoredReservationId
                    ? {
                        NOT: {
                            id: ignoredReservationId,
                        },
                    }
                    : {}),
                startAt: {
                    lt: endAt,
                },
                endAt: {
                    gt: startAt,
                },
            },
        });

        if (reservationCollision) {
            throw new ConflictException('Vehicle is already reserved in this time range.');
        }

        const serviceCollision = await this.prisma.serviceEvent.findFirst({
            where: {
                vehicleId,
                status: 'ACTIVE',
                startAt: {
                    lt: endAt,
                },
                endAt: {
                    gt: startAt,
                },
            },
        });

        if (serviceCollision) {
            throw new ConflictException('Vehicle is blocked by service in this time range.');
        }
    }
}