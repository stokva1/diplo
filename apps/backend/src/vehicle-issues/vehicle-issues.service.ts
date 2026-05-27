import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class VehicleIssuesService {
    constructor(private readonly prisma: PrismaService) {}

    async createForReservation(
        currentUser: CurrentUser,
        reservationId: string,
        description: string,
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
            throw new ForbiddenException('You cannot report issue for this reservation.');
        }

        const issue = await this.prisma.vehicleIssue.create({
            data: {
                vehicleId: reservation.vehicleId,
                reservationId: reservation.id,
                reportedByMembershipId: currentUser.membershipId,
                description,
                status: 'OPEN',
            },
            include: {
                vehicle: true,
                reportedByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return this.toIssueResponse(issue);
    }

    private toIssueResponse(issue: any) {
        return {
            id: issue.id,
            vehicle: {
                id: issue.vehicle.id,
                name: issue.vehicle.name,
                licensePlate: issue.vehicle.licensePlate,
            },
            reservationId: issue.reservationId,
            reportedBy: {
                id: issue.reportedByMembership.id,
                name: issue.reportedByMembership.user.name,
                email: issue.reportedByMembership.user.email,
            },
            description: issue.description,
            status: issue.status,
            resolvedByMembershipId: issue.resolvedByMembershipId,
            resolvedAt: issue.resolvedAt,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
        };
    }

    async findAll(currentUser: CurrentUser, scope = 'mine') {
        if (!['mine', 'managed', 'all'].includes(scope)) {
            throw new BadRequestException('Invalid issue scope.');
        }

        if (scope === 'all' && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view all issues.');
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
                        reportedByMembershipId: currentUser.membershipId,
                    };

        const issues = await this.prisma.vehicleIssue.findMany({
            where,
            include: {
                vehicle: true,
                reportedByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            data: issues.map((issue) => this.toIssueResponse(issue)),
        };
    }

    async findOne(currentUser: CurrentUser, issueId: string) {
        const issue = await this.prisma.vehicleIssue.findFirst({
            where: {
                id: issueId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                reportedByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!issue) {
            throw new NotFoundException('Issue not found.');
        }

        const isReporter =
            issue.reportedByMembershipId === currentUser.membershipId;
        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            issue.vehicle.managerMembershipId === currentUser.membershipId;

        if (!isReporter && !isAdmin && !isVehicleManager) {
            throw new ForbiddenException('You cannot view this issue.');
        }

        return this.toIssueResponse(issue);
    }

    async resolve(currentUser: CurrentUser, issueId: string) {
        const issue = await this.prisma.vehicleIssue.findFirst({
            where: {
                id: issueId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                reportedByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!issue) {
            throw new NotFoundException('Issue not found.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            issue.vehicle.managerMembershipId === currentUser.membershipId;

        if (!isAdmin && !isVehicleManager) {
            throw new ForbiddenException('You cannot resolve this issue.');
        }

        if (issue.status === 'RESOLVED') {
            return this.toIssueResponse(issue);
        }

        const resolvedIssue = await this.prisma.vehicleIssue.update({
            where: {
                id: issue.id,
            },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
                resolvedByMembershipId: currentUser.membershipId,
                updatedAt: new Date(),
            },
            include: {
                vehicle: true,
                reportedByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return this.toIssueResponse(resolvedIssue);
    }
}