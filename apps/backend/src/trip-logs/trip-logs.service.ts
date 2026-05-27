import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class TripLogsService {
    constructor(private readonly prisma: PrismaService) {}

    async findMissing(currentUser: CurrentUser) {
        const reservations = await this.prisma.reservation.findMany({
            where: {
                membershipId: currentUser.membershipId,
                status: 'ACTIVE',
                endAt: {
                    lt: new Date(),
                },
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
                tripLog: null,
            },
            include: {
                vehicle: true,
            },
            orderBy: {
                endAt: 'desc',
            },
        });

        return {
            data: reservations.map((reservation) => ({
                reservationId: reservation.id,
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
            })),
        };
    }
}