import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../database/prisma.service';
import {UpdateMembershipDto} from "./dto/update-membership.dto";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class MembershipsService {
    constructor(private readonly prisma: PrismaService) {
    }

    async findAll(currentUser: CurrentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view memberships.');
        }

        const memberships = await this.prisma.membership.findMany({
            where: {
                organizationId: currentUser.organizationId,
            },
            include: {
                user: true,
                managedVehicles: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return {
            data: memberships.map((membership) =>
                this.toMembershipResponse(membership),
            ),
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

        const updatedMembership = await this.prisma.membership.update({
            where: {
                id: membership.id,
            },
            data: {
                role: dto.role,
                updatedAt: new Date(),
            },
            include: {
                user: true,
                managedVehicles: true,
            },
        });

        return this.toMembershipResponse(updatedMembership);
    }

    async disable(currentUser: CurrentUser, membershipId: string) {
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
            return this.toMembershipResponse(membership);
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const disabledMembership = await tx.membership.update({
                where: {
                    id: membership.id,
                },
                data: {
                    status: 'DISABLED',
                    updatedAt: new Date(),
                },
                include: {
                    user: true,
                    managedVehicles: true,
                },
            });

            await tx.reservation.updateMany({
                where: {
                    membershipId: membership.id,
                    status: 'ACTIVE',
                    startAt: {
                        gt: new Date(),
                    },
                },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelledByMembershipId: currentUser.membershipId,
                    updatedAt: new Date(),
                },
            });

            return disabledMembership;
        });

        return this.toMembershipResponse(result);
    }
}