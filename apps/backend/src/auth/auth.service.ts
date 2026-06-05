import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {PrismaService} from '../database/prisma.service';
import {RegisterOrganizationDto} from './dto/register-organization.dto';
import {LoginDto} from './dto/login.dto';
import {JwtService} from '@nestjs/jwt';
import {PasswordResetConfirmDto} from "./dto/password-reset-confirm.dto";
import {PasswordResetRequestDto} from "./dto/password-reset-request.dto";
import {RefreshTokenDto} from "./dto/refresh-token.dto";
import {NotificationsService} from "../notifications/notifications.service";

type AccessTokenPayload = {
    sub: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

type RefreshTokenPayload = {
    sub: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly notificationsService: NotificationsService,
    ) {
    }

    private async getManagedVehicleIds(membershipId: string) {
        const vehicles = await this.prisma.vehicle.findMany({
            where: {
                managerMembershipId: membershipId,
                status: {
                    not: 'ARCHIVED',
                },
            },
            select: {
                id: true,
            },
        });

        return vehicles.map((vehicle) => vehicle.id);
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

                const tokenPayload = {
                    sub: user.id,
                    membershipId: membership.id,
                    organizationId: organization.id,
                    role: membership.role,
                };

                const accessToken = await this.generateAccessToken(tokenPayload);
                const refreshToken = await this.generateRefreshToken(tokenPayload);

                return {
                    accessToken,
                    refreshToken,
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
                    member: {
                        id: membership.id,
                        organizationId: membership.organizationId,
                        role: membership.role,
                        status: membership.status,
                        managedVehicleIds: [],
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
            expiresIn: '6h', //TODO: Change to like couple minutes for production
        });
    }

    private async generateRefreshToken(
        payload: RefreshTokenPayload,
    ): Promise<string> {
        const secret = process.env.JWT_REFRESH_SECRET;

        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET is not set');
        }

        return this.jwtService.signAsync(payload, {
            secret,
            expiresIn: '7d',
        });
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

        const tokenPayload = {
            sub: user.id,
            membershipId: membership.id,
            organizationId: membership.organizationId,
            role: membership.role,
        };

        const accessToken = await this.generateAccessToken(tokenPayload);
        const refreshToken = await this.generateRefreshToken(tokenPayload);

        const managedVehicleIds = await this.getManagedVehicleIds(membership.id);

        return {
            accessToken,
            refreshToken,
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
            member: {
                id: membership.id,
                organizationId: membership.organizationId,
                role: membership.role,
                status: membership.status,
                managedVehicleIds,
            },
        };
    }

    async logout() {
        return undefined;
    }

    async refresh(dto: RefreshTokenDto) {
        const secret = process.env.JWT_REFRESH_SECRET;

        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET is not set');
        }

        let payload: RefreshTokenPayload;

        try {
            payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
                dto.refreshToken,
                {
                    secret,
                },
            );
        } catch {
            throw new UnauthorizedException('Invalid refresh token.');
        }

        const membership = await this.prisma.membership.findFirst({
            where: {
                id: payload.membershipId,
                userId: payload.sub,
                organizationId: payload.organizationId,
                status: 'ACTIVE',
            },
        });

        if (!membership) {
            throw new UnauthorizedException('Membership is not active.');
        }

        const accessToken = await this.generateAccessToken({
            sub: payload.sub,
            membershipId: membership.id,
            organizationId: membership.organizationId,
            role: membership.role,
        });

        return {
            accessToken,
        };
    }

    async requestPasswordReset(dto: PasswordResetRequestDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (!user) {
            return undefined;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(token);

        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        try {
            await this.notificationsService.sendPasswordResetEmail({
                to: user.email,
                name: user.name,
                token,
            });
        } catch (error) {
            console.error('Password reset e-mail could not be sent.', error);
        }

        return undefined;
    }

    async confirmPasswordReset(dto: PasswordResetConfirmDto) {
        const tokenHash = hashToken(dto.token);

        const passwordResetToken = await this.prisma.passwordResetToken.findFirst({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });

        if (!passwordResetToken) {
            throw new BadRequestException('Invalid or expired password reset token.');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 12);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: {
                    id: passwordResetToken.userId,
                },
                data: {
                    passwordHash,
                    updatedAt: new Date(),
                },
            }),
            this.prisma.passwordResetToken.update({
                where: {
                    id: passwordResetToken.id,
                },
                data: {
                    usedAt: new Date(),
                },
            }),
        ]);

        return undefined;
    }
}