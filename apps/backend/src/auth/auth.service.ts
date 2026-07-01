import {
    BadRequestException,
    ForbiddenException,
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
import {ChangePasswordDto} from "./dto/change-password.dto";

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
        const email = dto.user.email.trim().toLowerCase();

        const existingUser = await this.prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            throw new BadRequestException(
                "Registration could not be completed. Try signing in or resetting your password.",
            );
        }

        const passwordHash = await bcrypt.hash(dto.user.password, 12);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenHash = hashToken(verificationToken);

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email,
                        name: dto.user.name.trim(),
                        passwordHash,
                    },
                });

                const organization = await tx.organization.create({
                    data: {
                        name: dto.organization.name.trim(),
                        ico: dto.organization.ico?.trim() || null,
                        contactEmail:
                            dto.organization.contactEmail?.trim().toLowerCase() || null,
                    },
                });

                await tx.membership.create({
                    data: {
                        userId: user.id,
                        organizationId: organization.id,
                        role: "ADMIN",
                        status: "ACTIVE",
                    },
                });

                await tx.organizationSettings.create({
                    data: {
                        organizationId: organization.id,
                    },
                });

                await tx.emailVerificationToken.create({
                    data: {
                        userId: user.id,
                        tokenHash: verificationTokenHash,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                });

                return {
                    email: user.email,
                    name: user.name,
                };
            });

            void this.notificationsService
                .sendEmailVerificationEmail({
                    to: result.email,
                    name: result.name,
                    token: verificationToken,
                })
                .catch((error) => {
                    console.error(
                        "Verification e-mail could not be sent.",
                        error,
                    );
                });

            return {
                email: result.email,
            };
        } catch {
            throw new InternalServerErrorException(
                "The organization could not be created.",
            );
        }
    }

    private async generateAccessToken(
        payload: AccessTokenPayload,
    ): Promise<string> {
        return this.jwtService.signAsync(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m', //TODO: Change to like couple minutes for production
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
                email: dto.email.trim().toLowerCase(),
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

        if (!user.emailVerifiedAt) {
            throw new ForbiddenException(
                "Verify your e-mail address before signing in.",
            );
        }

        const membership = user.memberships.find(
            (membership) => membership.status === 'ACTIVE',
        );

        if (!membership) {
            throw new ForbiddenException('Membership is not active.');
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

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                passwordHash: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException("User was not found.");
        }

        const passwordMatches = await bcrypt.compare(
            dto.currentPassword,
            user.passwordHash,
        );

        if (!passwordMatches) {
            throw new BadRequestException("Current password is incorrect.");
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 12);

        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                passwordHash,
                updatedAt: new Date(),
            },
        });

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
            throw new ForbiddenException('Membership is not active.');
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
                email: dto.email.trim().toLowerCase(),
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

        void this.notificationsService
            .sendPasswordResetEmail({
                to: user.email,
                name: user.name,
                token,
            })
            .catch((error) => {
                console.error('Password reset e-mail could not be sent.', error);
            });

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

    async confirmEmailVerification(token: string) {
        const tokenHash = hashToken(token);

        const verificationToken =
            await this.prisma.emailVerificationToken.findFirst({
                where: {
                    tokenHash,
                    usedAt: null,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });

        if (!verificationToken) {
            throw new BadRequestException(
                "Invalid or expired e-mail verification token.",
            );
        }

        const now = new Date();

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: {
                    id: verificationToken.userId,
                },
                data: {
                    emailVerifiedAt: now,
                    updatedAt: now,
                },
            }),
            this.prisma.emailVerificationToken.update({
                where: {
                    id: verificationToken.id,
                },
                data: {
                    usedAt: now,
                },
            }),
        ]);

        return undefined;
    }
}