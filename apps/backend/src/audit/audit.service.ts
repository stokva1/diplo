import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildPaginationMeta, getPagination } from '../common/pagination';
import { FindAuditLogsQueryDto } from './dto/find-audit-logs-query.dto';

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class AuditService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(currentUser: CurrentUser, query: FindAuditLogsQueryDto) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view audit logs.');
        }

        const where: any = {
            organizationId: currentUser.organizationId,
        };

        if (query.actorMemberId) {
            where.actorMembershipId = query.actorMemberId;
        }

        if (query.entityType) {
            where.entityType = query.entityType;
        }

        if (query.entityId) {
            where.entityId = query.entityId;
        }

        if (query.action) {
            where.action = query.action;
        }

        if (query.from || query.to) {
            where.createdAt = {};

            if (query.from) {
                where.createdAt.gte = new Date(query.from);
            }

            if (query.to) {
                where.createdAt.lte = new Date(query.to);
            }
        }

        const { page, limit, skip, take } = getPagination(query);

        const [auditLogs, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    actorMembership: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: this.getOrderBy(query.sort),
                skip,
                take,
            }),
            this.prisma.auditLog.count({
                where,
            }),
        ]);

        return {
            data: auditLogs.map((auditLog) => this.toAuditLogResponse(auditLog)),
            pagination: buildPaginationMeta({
                page,
                limit,
                total,
            }),
        };
    }

    async create(params: {
        organizationId: string;
        actorMembershipId: string;
        action: string;
        entityType: string;
        entityId: string;
        oldValues?: unknown;
        newValues?: unknown;
    }) {
        return this.prisma.auditLog.create({
            data: {
                organizationId: params.organizationId,
                actorMembershipId: params.actorMembershipId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                oldValues: params.oldValues as any,
                newValues: params.newValues as any,
            },
        });
    }

    private toAuditLogResponse(auditLog: any) {
        return {
            id: auditLog.id,
            actor: auditLog.actorMembership
                ? {
                    id: auditLog.actorMembership.id,
                    name: auditLog.actorMembership.user.name,
                }
                : null,
            action: auditLog.action,
            entityType: auditLog.entityType,
            entityId: auditLog.entityId,
            oldValues: auditLog.oldValues,
            newValues: auditLog.newValues,
            createdAt: auditLog.createdAt,
        };
    }

    private getOrderBy(sort?: string) {
        switch (sort) {
            case 'createdAt':
                return { createdAt: 'asc' as const };
            case '-createdAt':
            default:
                return { createdAt: 'desc' as const };
        }
    }
}