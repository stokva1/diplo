import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {FindMissingTripLogsQueryDto} from "./dto/find-missing-trip-logs-query.dto";
import {FindTripLogsQueryDto} from "./dto/find-trip-logs-query.dto";
import {UpdateTripLogDto} from "./dto/update-trip-log.dto";
import {buildPaginationMeta, getPagination} from "../common/pagination";
import {AuditService} from "../audit/audit.service";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class TripLogsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {}

    async findMissing(
        currentUser: CurrentUser,
        query: FindMissingTripLogsQueryDto,
    ) {
        const scope = query.scope ?? 'mine';

        if (!['mine', 'managed', 'all'].includes(scope)) {
            throw new BadRequestException('Invalid missing trip log scope.');
        }

        if (scope === 'all' && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can view all missing trip logs.',
            );
        }

        if (query.memberId && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can filter missing trip logs by member.',
            );
        }

        const where: any =
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

        where.status = 'ACTIVE';
        where.endAt = {
            lt: new Date(),
        };
        where.tripLog = null;

        if (query.vehicleId) {
            where.vehicleId = query.vehicleId;
        }

        if (query.memberId) {
            where.membershipId = query.memberId;
        }

        if (query.from || query.to) {
            where.startAt = {};

            if (query.from) {
                where.startAt.gte = new Date(query.from);
            }

            if (query.to) {
                where.startAt.lte = new Date(query.to);
            }
        }

        const { page, limit, skip, take } = getPagination(query);

        const [reservations, total] = await this.prisma.$transaction([
            this.prisma.reservation.findMany({
                where,
                include: {
                    vehicle: true,
                    membership: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: this.getMissingOrderBy(query.sort),
                skip,
                take,
            }),
            this.prisma.reservation.count({
                where,
            }),
        ]);

        return {
            data: reservations.map((reservation) => ({
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
                startAt: reservation.startAt,
                endAt: reservation.endAt,
                origin: reservation.origin,
                destination: reservation.destination,
                purpose: reservation.purpose,
            })),
            pagination: buildPaginationMeta({
                page,
                limit,
                total,
            }),
        };
    }

    async findAll(currentUser: CurrentUser, query: FindTripLogsQueryDto) {
        const scope = query.scope ?? 'mine';

        if (!['mine', 'managed', 'all'].includes(scope)) {
            throw new BadRequestException('Invalid trip log scope.');
        }

        if (scope === 'all' && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can view all trip logs.',
            );
        }

        if (query.memberId && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can filter trip logs by member.',
            );
        }

        const where: any =
            scope === 'all'
                ? {
                    reservation: {
                        vehicle: {
                            organizationId: currentUser.organizationId,
                        },
                    },
                }
                : scope === 'managed'
                    ? {
                        reservation: {
                            vehicle: {
                                organizationId: currentUser.organizationId,
                                managerMembershipId: currentUser.membershipId,
                            },
                        },
                    }
                    : {
                        reservation: {
                            vehicle: {
                                organizationId: currentUser.organizationId,
                            },
                            membershipId: currentUser.membershipId,
                        },
                    };

        if (query.vehicleId) {
            where.reservation.vehicleId = query.vehicleId;
        }

        if (query.memberId) {
            where.reservation.membershipId = query.memberId;
        }

        if (query.from || query.to) {
            where.reservation.startAt = {};

            if (query.from) {
                where.reservation.startAt.gte = new Date(query.from);
            }

            if (query.to) {
                where.reservation.startAt.lte = new Date(query.to);
            }
        }

        if (query.refueled !== undefined) {
            where.refueled = query.refueled === 'true';
        }

        const { page, limit, skip, take } = getPagination(query);

        const [tripLogs, total] = await this.prisma.$transaction([
            this.prisma.tripLog.findMany({
                where,
                include: {
                    reservation: {
                        include: {
                            vehicle: true,
                            membership: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                    completedByMembership: {
                        include: {
                            user: true,
                        },
                    },
                    refuelingReceiptFile: true,
                },
                orderBy: this.getOrderBy(query.sort),
                skip,
                take,
            }),
            this.prisma.tripLog.count({
                where,
            }),
        ]);

        return {
            data: tripLogs.map((tripLog) => this.toTripLogResponse(tripLog)),
            pagination: buildPaginationMeta({
                page,
                limit,
                total,
            }),
        };
    }

    async findOne(
        currentUser: CurrentUser,
        tripLogId: string,
    ) {
        const tripLog = await this.prisma.tripLog.findFirst({
            where: {
                id: tripLogId,
                reservation: {
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                },
            },
            include: {
                reservation: {
                    include: {
                        vehicle: true,
                        membership: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                completedByMembership: {
                    include: {
                        user: true,
                    },
                },
                refuelingReceiptFile: true,
            },
        });

        if (!tripLog) {
            throw new NotFoundException('Trip log not found.');
        }

        const isOwner =
            tripLog.reservation.membershipId === currentUser.membershipId;

        const isVehicleManager =
            tripLog.reservation.vehicle.managerMembershipId ===
            currentUser.membershipId;

        const isAdmin = currentUser.role === 'ADMIN';

        if (!isOwner && !isVehicleManager && !isAdmin) {
            throw new ForbiddenException('You cannot view this trip log.');
        }

        return this.toTripLogResponse(tripLog);
    }

    private toTripLogResponse(tripLog: any) {
        return {
            id: tripLog.id,
            reservationId: tripLog.reservationId,
            vehicle: {
                id: tripLog.reservation.vehicle.id,
                name: tripLog.reservation.vehicle.name,
                licensePlate: tripLog.reservation.vehicle.licensePlate,
            },
            member: {
                id: tripLog.reservation.membership.id,
                name: tripLog.reservation.membership.user.name,
                email: tripLog.reservation.membership.user.email,
            },
            completedBy: {
                id: tripLog.completedByMembership.id,
                name: tripLog.completedByMembership.user.name,
                email: tripLog.completedByMembership.user.email,
            },
            startAt: tripLog.reservation.startAt,
            endAt: tripLog.reservation.endAt,
            origin: tripLog.reservation.origin,
            destination: tripLog.reservation.destination,
            purpose: tripLog.reservation.purpose,
            odometerStartKm: tripLog.odometerStartKm,
            odometerEndKm: tripLog.odometerEndKm,
            distanceKm: tripLog.distanceKm,
            refueled: tripLog.refueled,
            refuelingCost: tripLog.refuelingCost,
            refuelingReceiptFile: tripLog.refuelingReceiptFile
                ? {
                    id: tripLog.refuelingReceiptFile.id,
                    fileName: tripLog.refuelingReceiptFile.fileName,
                }
                : null,
            note: tripLog.note,
            completedAt: tripLog.completedAt,
            updatedAt: tripLog.updatedAt,
        };
    }

    async updateForReservation(
        currentUser: CurrentUser,
        reservationId: string,
        dto: UpdateTripLogDto,
    ) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can update trip log.');
        }

        const tripLog = await this.prisma.tripLog.findFirst({
            where: {
                reservationId,
                reservation: {
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                },
            },
            include: {
                reservation: {
                    include: {
                        vehicle: true,
                        membership: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                completedByMembership: {
                    include: {
                        user: true,
                    },
                },
                refuelingReceiptFile: true,
            },
        });

        if (!tripLog) {
            throw new NotFoundException('Trip log not found.');
        }

        const oldValues = {
            odometerStartKm: tripLog.odometerStartKm,
            odometerEndKm: tripLog.odometerEndKm,
            distanceKm: tripLog.distanceKm,
            refueled: tripLog.refueled,
            refuelingCost: tripLog.refuelingCost,
            refuelingReceiptFileId: tripLog.refuelingReceiptFileId,
            note: tripLog.note,
        };

        const nextOdometerStartKm =
            dto.odometerStartKm ?? tripLog.odometerStartKm;
        const nextOdometerEndKm =
            dto.odometerEndKm ?? tripLog.odometerEndKm;

        if (nextOdometerEndKm < nextOdometerStartKm) {
            throw new BadRequestException(
                'odometerEndKm must be greater than or equal to odometerStartKm.',
            );
        }

        if (dto.refuelingReceiptFileId) {
            const file = await this.prisma.fileAttachment.findFirst({
                where: {
                    id: dto.refuelingReceiptFileId,
                    organizationId: currentUser.organizationId,
                    deletedAt: null,
                },
            });

            if (!file) {
                throw new NotFoundException('Refueling receipt file not found.');
            }

            if (file.purpose !== 'FUEL_RECEIPT') {
                throw new BadRequestException(
                    'Refueling receipt file must be uploaded with purpose FUEL_RECEIPT.',
                );
            }
        }

        const shouldReplaceReceipt =
            dto.refuelingReceiptFileId !== undefined &&
            dto.refuelingReceiptFileId !== tripLog.refuelingReceiptFileId;

        const oldReceiptFile = shouldReplaceReceipt
            ? tripLog.refuelingReceiptFile
            : null;

        const updatedTripLog = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.tripLog.update({
                where: {
                    id: tripLog.id,
                },
                data: {
                    odometerStartKm: dto.odometerStartKm,
                    odometerEndKm: dto.odometerEndKm,
                    refueled: dto.refueled,
                    refuelingCost: dto.refuelingCost,
                    refuelingReceiptFileId: dto.refuelingReceiptFileId,
                    note: dto.note,
                    updatedAt: new Date(),
                },
                include: {
                    reservation: {
                        include: {
                            vehicle: true,
                            membership: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                    completedByMembership: {
                        include: {
                            user: true,
                        },
                    },
                    refuelingReceiptFile: true,
                },
            });

            if (oldReceiptFile) {
                await tx.fileAttachment.update({
                    where: {
                        id: oldReceiptFile.id,
                    },
                    data: {
                        deletedAt: new Date(),
                    },
                });
            }

            return updated;
        });

        if (
            updatedTripLog.odometerEndKm >
            updatedTripLog.reservation.vehicle.currentOdometerKm
        ) {
            await this.prisma.vehicle.update({
                where: {
                    id: updatedTripLog.reservation.vehicleId,
                },
                data: {
                    currentOdometerKm: updatedTripLog.odometerEndKm,
                },
            });
        }

        const newValues = {
            odometerStartKm: updatedTripLog.odometerStartKm,
            odometerEndKm: updatedTripLog.odometerEndKm,
            distanceKm: updatedTripLog.distanceKm,
            refueled: updatedTripLog.refueled,
            refuelingCost: updatedTripLog.refuelingCost,
            refuelingReceiptFileId: updatedTripLog.refuelingReceiptFileId,
            note: updatedTripLog.note,
        };

        await this.auditService.create({
            organizationId: currentUser.organizationId,
            actorMembershipId: currentUser.membershipId,
            action: 'TRIP_LOG_UPDATED',
            entityType: 'TripLog',
            entityId: updatedTripLog.id,
            oldValues,
            newValues,
        });

        return this.toTripLogResponse(updatedTripLog);
    }

    private getOrderBy(sort?: string) {
        switch (sort) {
            case 'completedAt':
                return { completedAt: 'asc' as const };
            case '-completedAt':
                return { completedAt: 'desc' as const };
            case 'startAt':
                return {
                    reservation: {
                        startAt: 'asc' as const,
                    },
                };
            case '-startAt':
                return {
                    reservation: {
                        startAt: 'desc' as const,
                    },
                };
            default:
                return { completedAt: 'desc' as const };
        }
    }

    private getMissingOrderBy(sort?: string) {
        switch (sort) {
            case 'endAt':
                return { endAt: 'asc' as const };
            case '-endAt':
                return { endAt: 'desc' as const };
            case 'startAt':
                return { startAt: 'asc' as const };
            case '-startAt':
                return { startAt: 'desc' as const };
            case 'createdAt':
                return { createdAt: 'asc' as const };
            case '-createdAt':
                return { createdAt: 'desc' as const };
            default:
                return { endAt: 'desc' as const };
        }
    }
}