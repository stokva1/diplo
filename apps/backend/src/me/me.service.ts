import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type AuthenticatedUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class MeService {
    constructor(private readonly prisma: PrismaService) {}

    async getMe(user: AuthenticatedUser) {
        const membership = await this.prisma.membership.findFirst({
            where: {
                id: user.membershipId,
                organizationId: user.organizationId,
                userId: user.userId,
            },
            include: {
                user: true,
                organization: true,
                managedVehicles: {
                    where: {
                        status: {
                            not: 'ARCHIVED',
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!membership) {
            throw new NotFoundException('Member context was not found.');
        }

        return {
            user: {
                id: membership.user.id,
                email: membership.user.email,
                name: membership.user.name,
            },
            organization: {
                id: membership.organization.id,
                name: membership.organization.name,
            },
            member: {
                id: membership.id,
                role: membership.role,
                status: membership.status,
                managedVehicleIds: membership.managedVehicles.map((vehicle) => vehicle.id),
            },
        };
    }
}