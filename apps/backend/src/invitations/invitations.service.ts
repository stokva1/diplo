import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class InvitationsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(currentUser: CurrentUser, dto: CreateInvitationDto) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can create invitations.');
        }

        const existingMembership = await this.prisma.membership.findFirst({
            where: {
                organizationId: currentUser.organizationId,
                user: {
                    email: dto.email,
                },
            },
        });

        if (existingMembership) {
            throw new ConflictException('User is already a member of this organization.');
        }

        const existingActiveInvitation = await this.prisma.invitation.findFirst({
            where: {
                organizationId: currentUser.organizationId,
                email: dto.email,
                acceptedAt: null,
                cancelledAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (existingActiveInvitation) {
            throw new ConflictException('Active invitation already exists.');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await this.prisma.invitation.create({
            data: {
                organizationId: currentUser.organizationId,
                email: dto.email,
                name: dto.name,
                tokenHash,
                expiresAt,
                createdById: currentUser.membershipId,
            },
            include: {
                organization: true,
                createdBy: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return {
            ...this.toInvitationResponse(invitation),
            token,
        };
    }

    async findAll(currentUser: CurrentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view invitations.');
        }

        const invitations = await this.prisma.invitation.findMany({
            where: {
                organizationId: currentUser.organizationId,
            },
            include: {
                organization: true,
                createdBy: {
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
            data: invitations.map((invitation) =>
                this.toInvitationResponse(invitation),
            ),
        };
    }

    async cancel(currentUser: CurrentUser, invitationId: string) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can cancel invitations.');
        }

        const invitation = await this.prisma.invitation.findFirst({
            where: {
                id: invitationId,
                organizationId: currentUser.organizationId,
            },
            include: {
                organization: true,
                createdBy: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!invitation) {
            throw new NotFoundException('Invitation not found.');
        }

        if (invitation.acceptedAt || invitation.cancelledAt) {
            return this.toInvitationResponse(invitation);
        }

        const cancelledInvitation = await this.prisma.invitation.update({
            where: {
                id: invitation.id,
            },
            data: {
                cancelledAt: new Date(),
            },
            include: {
                organization: true,
                createdBy: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return this.toInvitationResponse(cancelledInvitation);
    }

    hashToken(token: string) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private getInvitationStatus(invitation: {
        acceptedAt: Date | null;
        cancelledAt: Date | null;
        expiresAt: Date;
    }) {
        if (invitation.acceptedAt) {
            return 'ACCEPTED';
        }

        if (invitation.cancelledAt) {
            return 'CANCELLED';
        }

        if (invitation.expiresAt < new Date()) {
            return 'EXPIRED';
        }

        return 'PENDING';
    }

    private toInvitationResponse(invitation: any) {
        return {
            id: invitation.id,
            email: invitation.email,
            name: invitation.name,
            organization: {
                id: invitation.organization.id,
                name: invitation.organization.name,
            },
            createdBy: {
                id: invitation.createdBy.id,
                name: invitation.createdBy.user.name,
                email: invitation.createdBy.user.email,
            },
            status: this.getInvitationStatus(invitation),
            expiresAt: invitation.expiresAt,
            acceptedAt: invitation.acceptedAt,
            cancelledAt: invitation.cancelledAt,
            createdAt: invitation.createdAt,
        };
    }
}