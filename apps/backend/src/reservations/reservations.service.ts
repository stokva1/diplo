import { BadRequestException, Injectable } from '@nestjs/common';
import { AvailabilityService } from '../availability/availability.service';
import { PrismaService } from '../database/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class ReservationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly availabilityService: AvailabilityService,
    ) {}

    async create(currentUser: CurrentUser, dto: CreateReservationDto) {
        const startAt = new Date(dto.startAt);
        const endAt = new Date(dto.endAt);

        if (endAt <= startAt) {
            throw new BadRequestException('endAt must be after startAt.');
        }

        if (startAt <= new Date()) {
            throw new BadRequestException('startAt must be in the future.');
        }

        await this.availabilityService.assertVehicleAvailableForReservation(
            currentUser.organizationId,
            dto.vehicleId,
            startAt,
            endAt,
        );

        const reservation = await this.prisma.reservation.create({
            data: {
                vehicleId: dto.vehicleId,
                membershipId: currentUser.membershipId,
                startAt,
                endAt,
                origin: dto.origin,
                destination: dto.destination,
                purpose: dto.purpose,
                status: 'ACTIVE',
            },
            include: {
                vehicle: true,
            },
        });

        return this.toReservationResponse(reservation);
    }

    private toReservationResponse(reservation: any) {
        return {
            id: reservation.id,
            vehicle: {
                id: reservation.vehicle.id,
                name: reservation.vehicle.name,
                licensePlate: reservation.vehicle.licensePlate,
            },
            startAt: reservation.startAt,
            endAt: reservation.endAt,
            origin: reservation.origin,
            destination: reservation.destination,
            purpose: reservation.purpose,
            status: reservation.status,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
        };
    }
}