import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../database/prisma.service';
import {UpdateMembershipDto} from "./dto/update-membership.dto";
import {FindMembersQueryDto} from "./dto/find-members-query.dto";
import {AuditService} from "../audit/audit.service";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class MembershipsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {}

    async findAll(currentUser: CurrentUser, query: FindMembersQueryDto) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view memberships.');
        }

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: any = {
            organizationId: currentUser.organizationId,
        };

        if (query.status) {
            where.status = query.status;
        }

        if (query.search) {
            where.user = {
                OR: [
                    {
                        name: {
                            contains: query.search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        email: {
                            contains: query.search,
                            mode: 'insensitive',
                        },
                    },
                ],
            };
        }

        const [memberships, total] = await this.prisma.$transaction([
            this.prisma.membership.findMany({
                where,
                include: {
                    user: true,
                    managedVehicles: true,
                },
                orderBy: this.getOrderBy(query.sort),
                skip,
                take: limit,
            }),
            this.prisma.membership.count({
                where,
            }),
        ]);

        return {
            data: memberships.map((membership) =>
                this.toMembershipListItemResponse(membership),
            ),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(currentUser: CurrentUser, membershipId: string) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view membership detail.');
        }

        const membership = await this.prisma.membership.findFirst({
            where: {
                id: membershipId,
                organizationId: currentUser.organizationId,
            },
            include: {
                user: true,
                managedVehicles: true,
            },
        });

        if (!membership) {
            throw new NotFoundException('Membership not found.');
        }

        return this.toMembershipResponse(membership);
    }

    private toMembershipResponse(membership: any) {
        return {
            id: membership.id,
            user: {
                id: membership.user.id,
                name: membership.user.name,
                email: membership.user.email,
            },
            role: membership.role,
            status: membership.status,
            managedVehicles: membership.managedVehicles.map((vehicle) => ({
                id: vehicle.id,
                name: vehicle.name,
                licensePlate: vehicle.licensePlate,
            })),
            createdAt: membership.createdAt,
            updatedAt: membership.updatedAt,
        };
    }

    private toMembershipListItemResponse(membership: any) {
        return {
            id: membership.id,
            userId: membership.user.id,
            name: membership.user.name,
            email: membership.user.email,
            role: membership.role,
            status: membership.status,
            managedVehicles: membership.managedVehicles.map((vehicle) => ({
                id: vehicle.id,
                name: vehicle.name,
                licensePlate: vehicle.licensePlate,
            })),
            createdAt: membership.createdAt,
        };
    }

    async update(
        currentUser: CurrentUser,
        membershipId: string,
        dto: UpdateMembershipDto,
    ) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can update memberships.');
        }

        const membership = await this.prisma.membership.findFirst({
            where: {
                id: membershipId,
                organizationId: currentUser.organizationId,
            },
            include: {
                user: true,
                managedVehicles: true,
            },
        });

        if (!membership) {
            throw new NotFoundException('Membership not found.');
        }

        const oldValues = {
            name: membership.user.name,
            role: membership.role,
        };

        const now = new Date();

        const updatedMembership = await this.prisma.$transaction(async (tx) => {
            if (dto.name !== undefined) {
                await tx.user.update({
                    where: {
                        id: membership.userId,
                    },
                    data: {
                        name: dto.name,
                        updatedAt: now,
                    },
                });
            }

            return tx.membership.update({
                where: {
                    id: membership.id,
                },
                data: {
                    role: dto.role,
                    updatedAt: now,
                },
                include: {
                    user: true,
                    managedVehicles: true,
                },
            });
        });

        const newValues = {
            name: updatedMembership.user.name,
            role: updatedMembership.role,
        };

        await this.auditService.create({
            organizationId: currentUser.organizationId,
            actorMembershipId: currentUser.membershipId,
            action: 'MEMBER_UPDATED',
            entityType: 'Membership',
            entityId: updatedMembership.id,
            oldValues,
            newValues,
        });

        return this.toMembershipResponse(updatedMembership);
    }

    async deactivate(currentUser: CurrentUser, membershipId: string) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can disable memberships.');
        }

        if (membershipId === currentUser.membershipId) {
            throw new ConflictException('Administrator cannot disable themselves.');
        }

        const membership = await this.prisma.membership.findFirst({
            where: {
                id: membershipId,
                organizationId: currentUser.organizationId,
            },
            include: {
                user: true,
                managedVehicles: true,
            },
        });

        if (!membership) {
            throw new NotFoundException('Membership not found.');
        }

        if (membership.status === 'DISABLED') {
            return {
                ...this.toMembershipResponse(membership),
                cancelledFutureReservationsCount: 0,
            };
        }

        const oldValues = {
            status: membership.status,
        };

        const now = new Date();

        const result = await this.prisma.$transaction(async (tx) => {
            const disabledMembership = await tx.membership.update({
                where: {
                    id: membership.id,
                },
                data: {
                    status: 'DISABLED',
                    updatedAt: now,
                },
                include: {
                    user: true,
                    managedVehicles: true,
                },
            });

            const cancelledReservations = await tx.reservation.updateMany({
                where: {
                    membershipId: membership.id,
                    status: 'ACTIVE',
                    startAt: {
                        gt: now,
                    },
                },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: now,
                    cancelledByMembershipId: currentUser.membershipId,
                    updatedAt: now,
                },
            });

            return {
                disabledMembership,
                cancelledFutureReservationsCount: cancelledReservations.count,
            };
        });

        const newValues = {
            status: result.disabledMembership.status,
            cancelledFutureReservationsCount:
            result.cancelledFutureReservationsCount,
        };

        await this.auditService.create({
            organizationId: currentUser.organizationId,
            actorMembershipId: currentUser.membershipId,
            action: 'MEMBER_DEACTIVATED',
            entityType: 'Membership',
            entityId: result.disabledMembership.id,
            oldValues,
            newValues,
        });

        return {
            ...this.toMembershipResponse(result.disabledMembership),
            cancelledFutureReservationsCount: result.cancelledFutureReservationsCount,
        };
    }

    private getOrderBy(sort?: string) {
        switch (sort) {
            case 'name':
                return {
                    user: {
                        name: 'asc' as const,
                    },
                };
            case '-name':
                return {
                    user: {
                        name: 'desc' as const,
                    },
                };
            case 'email':
                return {
                    user: {
                        email: 'asc' as const,
                    },
                };
            case '-email':
                return {
                    user: {
                        email: 'desc' as const,
                    },
                };
            case 'role':
                return { role: 'asc' as const };
            case '-role':
                return { role: 'desc' as const };
            case 'status':
                return { status: 'asc' as const };
            case '-status':
                return { status: 'desc' as const };
            case 'createdAt':
                return { createdAt: 'asc' as const };
            case '-createdAt':
            default:
                return { createdAt: 'desc' as const };
        }
    }
}