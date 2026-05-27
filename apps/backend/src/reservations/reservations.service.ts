import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import {AvailabilityService} from '../availability/availability.service';
import {PrismaService} from '../database/prisma.service';
import {VehicleIssuesService} from '../vehicle-issues/vehicle-issues.service';
import {CreateReservationDto} from './dto/create-reservation.dto';
import {UpdateReservationDto} from './dto/update-reservation.dto';
import {CreateTripLogDto} from '../trip-logs/dto/create-trip-log.dto';
import {CreateReservationIssueDto} from '../vehicle-issues/dto/create-reservation-issue.dto';

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
        private readonly vehicleIssuesService: VehicleIssuesService,
    ) {
    }

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
            member: reservation.membership
                ? {
                    id: reservation.membership.id,
                    name: reservation.membership.user.name,
                    email: reservation.membership.user.email,
                }
                : undefined,
            startAt: reservation.startAt,
            endAt: reservation.endAt,
            origin: reservation.origin,
            destination: reservation.destination,
            purpose: reservation.purpose,
            status: this.getReservationPresentationStatus(reservation),
            cancelledAt: reservation.cancelledAt,
            cancelledByMembershipId: reservation.cancelledByMembershipId,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
        };
    }

    async findAll(currentUser: CurrentUser, scope = 'mine') {
        if (!['mine', 'managed', 'all'].includes(scope)) {
            throw new BadRequestException('Invalid reservation scope.');
        }

        if (scope === 'all' && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view all reservations.');
        }

        const where =
            scope === 'all'
                ? {
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                }
                : scope === 'managed'
                    ? {
                        vehicle: {
                            organizationId: currentUser.organizationId,
                            managerMembershipId: currentUser.membershipId,
                        },
                    }
                    : {
                        vehicle: {
                            organizationId: currentUser.organizationId,
                        },
                        membershipId: currentUser.membershipId,
                    };

        const reservations = await this.prisma.reservation.findMany({
            where,
            include: {
                vehicle: true,
                membership: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: {
                startAt: 'desc',
            },
        });

        return {
            data: reservations.map((reservation) =>
                this.toReservationResponse(reservation),
            ),
        };
    }

    async findOne(currentUser: CurrentUser, reservationId: string) {
        const reservation = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                membership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!reservation) {
            throw new NotFoundException('Reservation not found.');
        }

        const isOwner = reservation.membershipId === currentUser.membershipId;
        const isAdmin = currentUser.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('You cannot view this reservation.');
        }

        return this.toReservationResponse(reservation);
    }

    private getReservationPresentationStatus(reservation: {
        status: string;
        endAt: Date;
    }) {
        if (reservation.status === 'CANCELLED') {
            return 'CANCELLED';
        }

        if (reservation.status === 'ACTIVE' && reservation.endAt < new Date()) {
            return 'FINISHED';
        }

        return 'ACTIVE';
    }

    async cancel(currentUser: CurrentUser, reservationId: string) {
        const reservation = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                membership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!reservation) {
            throw new NotFoundException('Reservation not found.');
        }

        if (reservation.status === 'CANCELLED') {
            return this.toReservationResponse(reservation);
        }

        const isOwner = reservation.membershipId === currentUser.membershipId;
        const isAdmin = currentUser.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('You cannot cancel this reservation.');
        }

        if (!isAdmin && reservation.startAt <= new Date()) {
            throw new ConflictException('Reservation has already started.');
        }

        const cancelledReservation = await this.prisma.reservation.update({
            where: {
                id: reservation.id,
            },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelledByMembershipId: currentUser.membershipId,
            },
            include: {
                vehicle: true,
                membership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return this.toReservationResponse(cancelledReservation);
    }

    async update(
        currentUser: CurrentUser,
        reservationId: string,
        dto: UpdateReservationDto,
    ) {
        const reservation = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                membership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!reservation) {
            throw new NotFoundException('Reservation not found.');
        }

        if (reservation.status === 'CANCELLED') {
            throw new ConflictException('Cancelled reservation cannot be updated.');
        }

        const isOwner = reservation.membershipId === currentUser.membershipId;
        const isAdmin = currentUser.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('You cannot update this reservation.');
        }

        if (!isAdmin && reservation.startAt <= new Date()) {
            throw new ConflictException('Reservation has already started.');
        }

        const nextVehicleId = dto.vehicleId ?? reservation.vehicleId;
        const nextStartAt = dto.startAt ? new Date(dto.startAt) : reservation.startAt;
        const nextEndAt = dto.endAt ? new Date(dto.endAt) : reservation.endAt;

        if (nextEndAt <= nextStartAt) {
            throw new BadRequestException('endAt must be after startAt.');
        }

        if (!isAdmin && nextStartAt <= new Date()) {
            throw new BadRequestException('startAt must be in the future.');
        }

        const changesAvailability =
            nextVehicleId !== reservation.vehicleId ||
            nextStartAt.getTime() !== reservation.startAt.getTime() ||
            nextEndAt.getTime() !== reservation.endAt.getTime();

        if (changesAvailability) {
            await this.availabilityService.assertVehicleAvailableForReservation(
                currentUser.organizationId,
                nextVehicleId,
                nextStartAt,
                nextEndAt,
                reservation.id,
            );
        }

        const updatedReservation = await this.prisma.reservation.update({
            where: {
                id: reservation.id,
            },
            data: {
                vehicleId: dto.vehicleId,
                startAt: dto.startAt ? nextStartAt : undefined,
                endAt: dto.endAt ? nextEndAt : undefined,
                origin: dto.origin,
                destination: dto.destination,
                purpose: dto.purpose,
                updatedAt: new Date(),
            },
            include: {
                vehicle: true,
                membership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return this.toReservationResponse(updatedReservation);
    }

    async getTripLog(currentUser: CurrentUser, reservationId: string) {
        const reservation = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                membership: {
                    include: {
                        user: true,
                    },
                },
                tripLog: true,
            },
        });

        if (!reservation) {
            throw new NotFoundException('Reservation not found.');
        }

        const isOwner = reservation.membershipId === currentUser.membershipId;
        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            reservation.vehicle.managerMembershipId === currentUser.membershipId;

        if (!isOwner && !isAdmin && !isVehicleManager) {
            throw new ForbiddenException('You cannot view this trip log.');
        }

        if (!reservation.tripLog) {
            throw new NotFoundException('Trip log not found.');
        }

        return {
            id: reservation.tripLog.id,
            reservationId: reservation.id,
            vehicle: {
                id: reservation.vehicle.id,
                name: reservation.vehicle.name,
                licensePlate: reservation.vehicle.licensePlate,
            },
            member: {
                id: reservation.membership.id,
                name: reservation.membership.user.name,
                email: reservation.membership.user.email,
            },
            odometerStartKm: reservation.tripLog.odometerStartKm,
            odometerEndKm: reservation.tripLog.odometerEndKm,
            distanceKm: reservation.tripLog.distanceKm,
            refueled: reservation.tripLog.refueled,
            refuelingCost: reservation.tripLog.refuelingCost,
            refuelingReceiptFileId: reservation.tripLog.refuelingReceiptFileId,
            note: reservation.tripLog.note,
            completedByMembershipId: reservation.tripLog.completedByMembershipId,
            completedAt: reservation.tripLog.completedAt,
            createdAt: reservation.tripLog.createdAt,
            updatedAt: reservation.tripLog.updatedAt,
        };
    }

    async createTripLog(
        currentUser: CurrentUser,
        reservationId: string,
        dto: CreateTripLogDto,
    ) {
        const reservation = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                membership: {
                    include: {
                        user: true,
                    },
                },
                tripLog: true,
            },
        });

        if (!reservation) {
            throw new NotFoundException('Reservation not found.');
        }

        if (reservation.status === 'CANCELLED') {
            throw new ConflictException('Cancelled reservation cannot have a trip log.');
        }

        if (reservation.endAt > new Date()) {
            throw new ConflictException('Reservation has not ended yet.');
        }

        const isOwner = reservation.membershipId === currentUser.membershipId;
        const isAdmin = currentUser.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('You cannot create trip log for this reservation.');
        }

        if (reservation.tripLog) {
            throw new ConflictException('Trip log already exists.');
        }

        if (dto.odometerEndKm < dto.odometerStartKm) {
            throw new BadRequestException(
                'odometerEndKm must be greater than or equal to odometerStartKm.',
            );
        }

        const tripLog = await this.prisma.tripLog.create({
            data: {
                reservationId: reservation.id,
                odometerStartKm: dto.odometerStartKm,
                odometerEndKm: dto.odometerEndKm,
                refueled: dto.refueled,
                refuelingCost: dto.refuelingCost,
                refuelingReceiptFileId: dto.refuelingReceiptFileId,
                note: dto.note,
                completedByMembershipId: currentUser.membershipId,
            },
        });

        const updatedVehicle =
            dto.odometerEndKm > reservation.vehicle.currentOdometerKm
                ? await this.prisma.vehicle.update({
                    where: {
                        id: reservation.vehicle.id,
                    },
                    data: {
                        currentOdometerKm: dto.odometerEndKm,
                        updatedAt: new Date(),
                    },
                })
                : reservation.vehicle;

        return {
            id: tripLog.id,
            reservationId: reservation.id,
            vehicle: {
                id: updatedVehicle.id,
                name: updatedVehicle.name,
                licensePlate: updatedVehicle.licensePlate,
                currentOdometerKm: updatedVehicle.currentOdometerKm,
            },
            member: {
                id: reservation.membership.id,
                name: reservation.membership.user.name,
                email: reservation.membership.user.email,
            },
            odometerStartKm: tripLog.odometerStartKm,
            odometerEndKm: tripLog.odometerEndKm,
            distanceKm: tripLog.distanceKm,
            refueled: tripLog.refueled,
            refuelingCost: tripLog.refuelingCost,
            refuelingReceiptFileId: tripLog.refuelingReceiptFileId,
            note: tripLog.note,
            completedByMembershipId: tripLog.completedByMembershipId,
            completedAt: tripLog.completedAt,
            createdAt: tripLog.createdAt,
            updatedAt: tripLog.updatedAt,
        };
    }

    async createIssue(
        currentUser: CurrentUser,
        reservationId: string,
        dto: CreateReservationIssueDto,
    ) {
        return this.vehicleIssuesService.createForReservation(
            currentUser,
            reservationId,
            dto.description,
        );
    }
}