import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {PrismaService} from '../database/prisma.service';
import {CreateInvitationDto} from './dto/create-invitation.dto';
import {UnauthorizedException} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {JwtService} from '@nestjs/jwt';
import {AcceptInvitationDto} from './dto/accept-invitation.dto';
import {FindInvitationsQueryDto} from "./dto/find-invitations-query.dto";
import {buildPaginationMeta, getPagination} from "../common/pagination";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class InvitationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {
    }

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
        const tokenHash = hashToken(token);

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
                createdBy: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return this.toInvitationResponse(invitation);
    }

    async findAll(currentUser: CurrentUser, query: FindInvitationsQueryDto) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view invitations.');
        }

        const now = new Date();

        const where: any = {
            organizationId: currentUser.organizationId,
        };

        if (query.status === 'PENDING') {
            where.acceptedAt = null;
            where.cancelledAt = null;
            where.expiresAt = {
                gt: now,
            };
        }

        if (query.status === 'ACCEPTED') {
            where.acceptedAt = {
                not: null,
            };
        }

        if (query.status === 'CANCELLED') {
            where.cancelledAt = {
                not: null,
            };
        }

        if (query.status === 'EXPIRED') {
            where.acceptedAt = null;
            where.cancelledAt = null;
            where.expiresAt = {
                lte: now,
            };
        }

        if (query.search) {
            where.OR = [
                {
                    email: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
                {
                    name: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        const {page, limit, skip, take} = getPagination(query);

        const [invitations, total] = await this.prisma.$transaction([
            this.prisma.invitation.findMany({
                where,
                include: {
                    createdBy: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: this.getOrderBy(query.sort),
                skip,
                take,
            }),
            this.prisma.invitation.count({
                where,
            }),
        ]);

        return {
            data: invitations.map((invitation) =>
                this.toInvitationResponse(invitation),
            ),
            pagination: buildPaginationMeta({
                page,
                limit,
                total,
            }),
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
            createdBy: {
                id: invitation.createdBy.id,
                name: invitation.createdBy.user.name,
            },
            status: this.getInvitationStatus(invitation),
            expiresAt: invitation.expiresAt,
            acceptedAt: invitation.acceptedAt,
            cancelledAt: invitation.cancelledAt,
            createdAt: invitation.createdAt,
        };
    }

    async findAcceptInfo(token: string) {
        const tokenHash = hashToken(token);

        const invitation = await this.prisma.invitation.findFirst({
            where: {
                tokenHash,
            },
            include: {
                organization: true,
            },
        });

        if (!invitation) {
            throw new UnauthorizedException('Invalid invitation token.');
        }

        if (invitation.cancelledAt) {
            throw new ConflictException('Invitation has been cancelled.');
        }

        if (invitation.acceptedAt) {
            throw new ConflictException('Invitation has already been accepted.');
        }

        if (invitation.expiresAt < new Date()) {
            throw new ConflictException('Invitation has expired.');
        }

        return {
            organizationName: invitation.organization.name,
            email: invitation.email,
            name: invitation.name,
            expiresAt: invitation.expiresAt,
        };
    }

    async accept(token: string, dto: AcceptInvitationDto) {
        const tokenHash = hashToken(token);

        const invitation = await this.prisma.invitation.findFirst({
            where: {
                tokenHash,
            },
            include: {
                organization: true,
            },
        });

        if (!invitation) {
            throw new UnauthorizedException('Invalid invitation token.');
        }

        if (invitation.cancelledAt) {
            throw new ConflictException('Invitation has been cancelled.');
        }

        if (invitation.acceptedAt) {
            throw new ConflictException('Invitation has already been accepted.');
        }

        if (invitation.expiresAt < new Date()) {
            throw new ConflictException('Invitation has expired.');
        }

        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: invitation.email,
            },
        });

        if (existingUser) {
            const existingMembership = await this.prisma.membership.findFirst({
                where: {
                    organizationId: invitation.organizationId,
                    userId: existingUser.id,
                },
            });

            if (existingMembership) {
                throw new ConflictException(
                    'User is already a member of this organization.',
                );
            }
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const userName = dto.name ?? invitation.name ?? invitation.email;

        return this.prisma.$transaction(async (tx) => {
            const user =
                existingUser ??
                (await tx.user.create({
                    data: {
                        email: invitation.email,
                        name: userName,
                        passwordHash,
                    },
                }));

            const membership = await tx.membership.create({
                data: {
                    organizationId: invitation.organizationId,
                    userId: user.id,
                    role: 'MEMBER',
                    status: 'ACTIVE',
                },
            });

            await tx.invitation.update({
                where: {
                    id: invitation.id,
                },
                data: {
                    acceptedAt: new Date(),
                },
            });

            const accessToken = await this.generateAccessToken({
                sub: user.id,
                membershipId: membership.id,
                organizationId: invitation.organizationId,
                role: membership.role,
            });

            return {
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                member: {
                    id: membership.id,
                    role: membership.role,
                    status: membership.status,
                },
                organization: {
                    id: invitation.organization.id,
                    name: invitation.organization.name,
                },
            };
        });
    }

    private async generateAccessToken(payload: {
        sub: string;
        membershipId: string;
        organizationId: string;
        role: string;
    }): Promise<string> {
        return this.jwtService.signAsync(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '6h',
        });
    }

    async resend(currentUser: CurrentUser, invitationId: string) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can resend invitation.');
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

        if (invitation.acceptedAt) {
            throw new ConflictException('Accepted invitation cannot be resent.');
        }

        if (invitation.cancelledAt) {
            throw new ConflictException('Cancelled invitation cannot be resent.');
        }

        const token = crypto.randomBytes(32).toString('hex');

        const updatedInvitation = await this.prisma.invitation.update({
            where: {
                id: invitation.id,
            },
            data: {
                tokenHash: hashToken(token),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

        return this.toInvitationResponse(updatedInvitation);
    }

    private getOrderBy(sort?: string) {
        switch (sort) {
            case 'email':
                return {email: 'asc' as const};
            case '-email':
                return {email: 'desc' as const};
            case 'name':
                return {name: 'asc' as const};
            case '-name':
                return {name: 'desc' as const};
            case 'expiresAt':
                return {expiresAt: 'asc' as const};
            case '-expiresAt':
                return {expiresAt: 'desc' as const};
            case 'createdAt':
                return {createdAt: 'asc' as const};
            case '-createdAt':
            default:
                return {createdAt: 'desc' as const};
        }
    }
}