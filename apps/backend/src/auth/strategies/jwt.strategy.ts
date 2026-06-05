import {ForbiddenException, Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {PrismaService} from '../../database/prisma.service';

type JwtPayload = {
    sub: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly prisma: PrismaService,
        configService: ConfigService,
    ) {
        const secret = configService.get<string>('JWT_ACCESS_SECRET');

        if (!secret) {
            throw new Error('JWT_ACCESS_SECRET is not configured.');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: JwtPayload) {
        const membership = await this.prisma.membership.findFirst({
            where: {
                id: payload.membershipId,
                userId: payload.sub,
                organizationId: payload.organizationId,
                status: 'ACTIVE',
            },
            select: {
                id: true,
                role: true,
                organizationId: true,
                userId: true,
            },
        });

        if (!membership) {
            throw new ForbiddenException('Membership is not active.');
        }

        return {
            userId: membership.userId,
            membershipId: membership.id,
            organizationId: membership.organizationId,
            role: membership.role,
        };
    }
}