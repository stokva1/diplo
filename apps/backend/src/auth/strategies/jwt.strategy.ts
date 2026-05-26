import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtPayload = {
    sub: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        const secret = process.env.JWT_ACCESS_SECRET;

        if (!secret) {
            throw new Error('JWT_ACCESS_SECRET is not set');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: secret,
        });
    }

    validate(payload: JwtPayload) {
        if (!payload.sub || !payload.membershipId || !payload.organizationId) {
            throw new UnauthorizedException();
        }

        return {
            userId: payload.sub,
            membershipId: payload.membershipId,
            organizationId: payload.organizationId,
            role: payload.role,
        };
    }
}