import {ForbiddenException, Injectable} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) {}

    async getMe(currentUser: CurrentUser) {
        const now = new Date();

        const upcomingReservations = await this.prisma.reservation.findMany({
            where: {
                membershipId: currentUser.membershipId,
                status: 'ACTIVE',
                startAt: {
                    gt: now,
                },
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
            },
            orderBy: {
                startAt: 'asc',
            },
            take: 5,
        });

        const missingTripLogs = await this.prisma.reservation.findMany({
            where: {
                membershipId: currentUser.membershipId,
                status: 'ACTIVE',
                endAt: {
                    lt: now,
                },
                tripLog: null,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
            },
            orderBy: {
                endAt: 'desc',
            },
            take: 5,
        });

        const recentTrips = await this.prisma.tripLog.findMany({
            where: {
                reservation: {
                    membershipId: currentUser.membershipId,
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                },
            },
            include: {
                reservation: {
                    include: {
                        vehicle: true,
                    },
                },
            },
            orderBy: {
                completedAt: 'desc',
            },
            take: 5,
        });

        return {
            upcomingReservations: upcomingReservations.map((reservation) => ({
                id: reservation.id,
                vehicleName: reservation.vehicle.name,
                licensePlate: reservation.vehicle.licensePlate,
                startAt: reservation.startAt,
                endAt: reservation.endAt,
                origin: reservation.origin,
                destination: reservation.destination,
                purpose: reservation.purpose,
            })),
            missingTripLogs: missingTripLogs.map((reservation) => ({
                reservationId: reservation.id,
                vehicleName: reservation.vehicle.name,
                licensePlate: reservation.vehicle.licensePlate,
                date: reservation.endAt.toISOString().slice(0, 10),
                origin: reservation.origin,
                destination: reservation.destination,
            })),
            recentTrips: recentTrips.map((tripLog) => ({
                tripLogId: tripLog.id,
                reservationId: tripLog.reservationId,
                vehicleName: tripLog.reservation.vehicle.name,
                licensePlate: tripLog.reservation.vehicle.licensePlate,
                date: tripLog.reservation.endAt.toISOString().slice(0, 10),
                origin: tripLog.reservation.origin,
                destination: tripLog.reservation.destination,
                distanceKm: tripLog.distanceKm,
            })),
        };
    }

    async getVehicles(currentUser: CurrentUser) {
        const now = new Date();

        const vehicles = await this.prisma.vehicle.findMany({
            where: {
                organizationId: currentUser.organizationId,
                managerMembershipId: currentUser.membershipId,
                status: {
                    not: 'ARCHIVED',
                },
            },
            include: {
                reservations: {
                    where: {
                        status: 'ACTIVE',
                        startAt: {
                            gt: now,
                        },
                    },
                    orderBy: {
                        startAt: 'asc',
                    },
                    take: 5,
                    include: {
                        membership: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                serviceEvents: {
                    where: {
                        status: 'ACTIVE',
                        endAt: {
                            gt: now,
                        },
                    },
                    orderBy: {
                        startAt: 'asc',
                    },
                    take: 5,
                },
                vehicleIssues: {
                    where: {
                        status: 'OPEN',
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 5,
                    include: {
                        reportedByMembership: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        const vehicleIds = vehicles.map((vehicle) => vehicle.id);

        const missingTripLogReservations = await this.prisma.reservation.findMany({
            where: {
                vehicleId: {
                    in: vehicleIds,
                },
                status: 'ACTIVE',
                endAt: {
                    lt: now,
                },
                tripLog: null,
            },
            include: {
                membership: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: {
                endAt: 'desc',
            },
        });

        const missingTripLogsByVehicleId = new Map<string, typeof missingTripLogReservations>();

        for (const reservation of missingTripLogReservations) {
            const existing = missingTripLogsByVehicleId.get(reservation.vehicleId) ?? [];
            existing.push(reservation);
            missingTripLogsByVehicleId.set(reservation.vehicleId, existing);
        }

        return {
            vehicles: vehicles.map((vehicle) => ({
                id: vehicle.id,
                name: vehicle.name,
                licensePlate: vehicle.licensePlate,
                brand: vehicle.brand,
                model: vehicle.model,
                currentOdometerKm: vehicle.currentOdometerKm,

                upcomingReservations: vehicle.reservations.map((reservation) => ({
                    id: reservation.id,
                    member: {
                        id: reservation.membership.id,
                        name: reservation.membership.user.name,
                    },
                    startAt: reservation.startAt,
                    endAt: reservation.endAt,
                    origin: reservation.origin,
                    destination: reservation.destination,
                    purpose: reservation.purpose,
                })),

                missingTripLogs: (missingTripLogsByVehicleId.get(vehicle.id) ?? []).map(
                    (reservation) => ({
                        reservationId: reservation.id,
                        member: {
                            id: reservation.membership.id,
                            name: reservation.membership.user.name,
                        },
                        date: reservation.endAt.toISOString().slice(0, 10),
                        origin: reservation.origin,
                        destination: reservation.destination,
                        endedAt: reservation.endAt,
                    }),
                ),

                serviceEvents: vehicle.serviceEvents.map((event) => ({
                    id: event.id,
                    title: event.title,
                    startAt: event.startAt,
                    endAt: event.endAt,
                    cost: event.cost,
                })),

                openIssues: vehicle.vehicleIssues.map((issue) => ({
                    id: issue.id,
                    reportedBy: {
                        id: issue.reportedByMembership.id,
                        name: issue.reportedByMembership.user.name,
                    },
                    description: issue.description,
                    createdAt: issue.createdAt,
                })),
            })),
        };
    }

    async getOrganization(currentUser: CurrentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can view organization dashboard.',
            );
        }

        const now = new Date();

        const [
            vehiclesCount,
            activeReservationsCount,
            missingTripLogsCount,
            openIssuesCount,
            upcomingServiceEventsCount,
        ] = await Promise.all([
            this.prisma.vehicle.count({
                where: {
                    organizationId: currentUser.organizationId,
                    status: {
                        not: 'ARCHIVED',
                    },
                },
            }),
            this.prisma.reservation.count({
                where: {
                    status: 'ACTIVE',
                    startAt: {
                        lte: now,
                    },
                    endAt: {
                        gte: now,
                    },
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                },
            }),
            this.prisma.reservation.count({
                where: {
                    status: 'ACTIVE',
                    endAt: {
                        lt: now,
                    },
                    tripLog: null,
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                },
            }),
            this.prisma.vehicleIssue.count({
                where: {
                    status: 'OPEN',
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                },
            }),
            this.prisma.serviceEvent.count({
                where: {
                    status: 'ACTIVE',
                    startAt: {
                        gt: now,
                    },
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                },
            }),
        ]);

        return {
            vehiclesCount,
            activeReservationsCount,
            missingTripLogsCount,
            openIssuesCount,
            upcomingServiceEventsCount,
        };
    }
}