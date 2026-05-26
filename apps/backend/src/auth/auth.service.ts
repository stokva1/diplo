import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {PrismaService} from '../database/prisma.service';
import {RegisterOrganizationDto} from './dto/register-organization.dto';
import {LoginDto} from './dto/login.dto';
import {JwtService} from '@nestjs/jwt';

type AccessTokenPayload = {
    sub: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {
    }

    async registerOrganization(dto: RegisterOrganizationDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: dto.user.email,
            },
        });

        if (existingUser) {
            throw new ConflictException('E-mail already exists.');
        }

        const passwordHash = await bcrypt.hash(dto.user.password, 12);

        try {
            return await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email: dto.user.email,
                        name: dto.user.name,
                        passwordHash,
                    },
                });

                const organization = await tx.organization.create({
                    data: {
                        name: dto.organization.name,
                        ico: dto.organization.ico,
                        contactEmail: dto.organization.contactEmail,
                    },
                });

                const membership = await tx.membership.create({
                    data: {
                        userId: user.id,
                        organizationId: organization.id,
                        role: 'ADMIN',
                        status: 'ACTIVE',
                    },
                });

                await tx.organizationSettings.create({
                    data: {
                        organizationId: organization.id,
                    },
                });

                const accessToken = await this.generateAccessToken({
                    sub: user.id,
                    membershipId: membership.id,
                    organizationId: organization.id,
                    role: membership.role,
                });

                return {
                    accessToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    },
                    organization: {
                        id: organization.id,
                        name: organization.name,
                        ico: organization.ico,
                        contactEmail: organization.contactEmail,
                    },
                    membership: {
                        id: membership.id,
                        role: membership.role,
                        status: membership.status,
                    },
                };
            });
        } catch (error) {
            throw new InternalServerErrorException(
                'The organization could not be created.',
            );
        }
    }

    private async generateAccessToken(
        payload: AccessTokenPayload,
    ): Promise<string> {
        return this.jwtService.signAsync(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m',
        });
    }

    async me(currentUser: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    }) {
        const membership = await this.prisma.membership.findFirst({
            where: {
                id: currentUser.membershipId,
                organizationId: currentUser.organizationId,
                userId: currentUser.userId,
                status: 'ACTIVE',
            },
            include: {
                user: true,
                organization: true,
            },
        });

        if (!membership) {
            throw new UnauthorizedException();
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
                ico: membership.organization.ico,
                contactEmail: membership.organization.contactEmail,
            },
            membership: {
                id: membership.id,
                role: membership.role,
                status: membership.status,
            },
        };
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
            include: {
                memberships: {
                    include: {
                        organization: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        const membership = user.memberships.find(
            (membership) => membership.status === 'ACTIVE',
        );

        if (!membership) {
            throw new UnauthorizedException('Membership is not active.');
        }

        const accessToken = await this.generateAccessToken({
            sub: user.id,
            membershipId: membership.id,
            organizationId: membership.organizationId,
            role: membership.role,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            organization: {
                id: membership.organization.id,
                name: membership.organization.name,
                ico: membership.organization.ico,
                contactEmail: membership.organization.contactEmail,
            },
            membership: {
                id: membership.id,
                role: membership.role,
                status: membership.status,
            },
        };
    }
}