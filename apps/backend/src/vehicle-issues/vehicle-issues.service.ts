import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {FindVehicleIssuesQueryDto} from "./dto/find-vehicle-issues-query.dto";
import {CreateReservationIssueDto} from "./dto/create-reservation-issue.dto";
import {buildPaginationMeta, getPagination} from "../common/pagination";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class VehicleIssuesService {
    constructor(private readonly prisma: PrismaService) {}

    async createForReservation(
        currentUser: CurrentUser,
        reservationId: string,
        dto: CreateReservationIssueDto,
    ) {
        const reservation = await this.prisma.reservation.findFirst({
            where: {
                id: reservationId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
            },
        });

        if (!reservation) {
            throw new NotFoundException('Reservation not found.');
        }

        const isOwner = reservation.membershipId === currentUser.membershipId;
        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            reservation.vehicle.managerMembershipId === currentUser.membershipId;

        if (!isOwner && !isAdmin && !isVehicleManager) {
            throw new ForbiddenException('You cannot report issue for this reservation.');
        }

        await this.validateIssuePhotoFiles(currentUser, dto.photoFileIds);

        const issue = await this.prisma.vehicleIssue.create({
            data: {
                vehicleId: reservation.vehicleId,
                reservationId: reservation.id,
                reportedByMembershipId: currentUser.membershipId,
                description: dto.description,
                status: 'OPEN',
                vehicleIssueAttachments: dto.photoFileIds?.length
                    ? {
                        create: dto.photoFileIds.map((fileId) => ({
                            fileAttachmentId: fileId,
                        })),
                    }
                    : undefined,
            },
            include: this.issueInclude(),
        });

        return this.toIssueResponse(issue);
    }

    private toIssueResponse(issue: any) {
        return {
            id: issue.id,
            vehicle: {
                id: issue.vehicle.id,
                name: issue.vehicle.name,
                licensePlate: issue.vehicle.licensePlate,
            },
            reservationId: issue.reservationId,
            reservation: issue.reservation
                ? {
                    id: issue.reservation.id,
                    startAt: issue.reservation.startAt,
                    endAt: issue.reservation.endAt,
                    origin: issue.reservation.origin,
                    destination: issue.reservation.destination,
                }
                : null,
            reportedBy: {
                id: issue.reportedByMembership.id,
                name: issue.reportedByMembership.user.name,
                email: issue.reportedByMembership.user.email,
            },
            description: issue.description,
            status: issue.status,
            photos: issue.vehicleIssueAttachments
                ? issue.vehicleIssueAttachments.map((attachment) => ({
                    id: attachment.fileAttachment.id,
                    fileName: attachment.fileAttachment.fileName,
                }))
                : [],
            resolvedBy: issue.resolvedByMembership
                ? {
                    id: issue.resolvedByMembership.id,
                    name: issue.resolvedByMembership.user.name,
                    email: issue.resolvedByMembership.user.email,
                }
                : null,
            resolvedByMembershipId: issue.resolvedByMembershipId,
            resolvedAt: issue.resolvedAt,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
        };
    }

    async findAll(currentUser: CurrentUser, query: FindVehicleIssuesQueryDto) {
        const scope = query.scope ?? 'mine';

        if (!['mine', 'managed', 'all'].includes(scope)) {
            throw new BadRequestException('Invalid issue scope.');
        }

        if (scope === 'all' && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view all issues.');
        }

        if (query.memberId && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can filter issues by member.',
            );
        }

        const where: any =
            scope === 'all'
                ? {
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                }
                : scope === 'managed'
                    ? {
                        vehicle: {
                            organizationId: currentUser.organizationId,
                            managerMembershipId: currentUser.membershipId,
                        },
                    }
                    : {
                        vehicle: {
                            organizationId: currentUser.organizationId,
                        },
                        reportedByMembershipId: currentUser.membershipId,
                    };

        if (query.status) {
            where.status = query.status;
        }

        if (query.vehicleId) {
            where.vehicleId = query.vehicleId;
        }

        if (query.memberId) {
            where.reportedByMembershipId = query.memberId;
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

        const [issues, total] = await this.prisma.$transaction([
            this.prisma.vehicleIssue.findMany({
                where,
                include: this.issueInclude(),
                orderBy: this.getOrderBy(query.sort),
                skip,
                take,
            }),
            this.prisma.vehicleIssue.count({
                where,
            }),
        ]);

        return {
            data: issues.map((issue) => this.toIssueResponse(issue)),
            pagination: buildPaginationMeta({
                page,
                limit,
                total,
            }),
        };
    }

    async findOne(currentUser: CurrentUser, issueId: string) {
        const issue = await this.prisma.vehicleIssue.findFirst({
            where: {
                id: issueId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: this.issueInclude(),
        });

        if (!issue) {
            throw new NotFoundException('Issue not found.');
        }

        const isReporter =
            issue.reportedByMembershipId === currentUser.membershipId;
        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            issue.vehicle.managerMembershipId === currentUser.membershipId;

        if (!isReporter && !isAdmin && !isVehicleManager) {
            throw new ForbiddenException('You cannot view this issue.');
        }

        return this.toIssueResponse(issue);
    }

    async resolve(currentUser: CurrentUser, issueId: string) {
        const issue = await this.prisma.vehicleIssue.findFirst({
            where: {
                id: issueId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: this.issueInclude(),
        });

        if (!issue) {
            throw new NotFoundException('Issue not found.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            issue.vehicle.managerMembershipId === currentUser.membershipId;

        if (!isAdmin && !isVehicleManager) {
            throw new ForbiddenException('You cannot resolve this issue.');
        }

        if (issue.status === 'RESOLVED') {
            return this.toIssueResponse(issue);
        }

        const resolvedIssue = await this.prisma.vehicleIssue.update({
            where: {
                id: issue.id,
            },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
                resolvedByMembershipId: currentUser.membershipId,
                updatedAt: new Date(),
            },
            include: this.issueInclude(),
        });

        return this.toIssueResponse(resolvedIssue);
    }

    private async validateIssuePhotoFiles(
        currentUser: CurrentUser,
        photoFileIds?: string[],
    ) {
        if (!photoFileIds || photoFileIds.length === 0) {
            return;
        }

        const files = await this.prisma.fileAttachment.findMany({
            where: {
                id: {
                    in: photoFileIds,
                },
                organizationId: currentUser.organizationId,
                deletedAt: null,
            },
        });

        if (files.length !== photoFileIds.length) {
            throw new NotFoundException('One or more issue photo files were not found.');
        }

        const invalidPurposeFile = files.find(
            (file) => file.purpose !== 'ISSUE_PHOTO',
        );

        if (invalidPurposeFile) {
            throw new BadRequestException(
                'Issue photos must be uploaded with purpose ISSUE_PHOTO.',
            );
        }
    }

    private issueInclude() {
        return {
            vehicle: true,
            reportedByMembership: {
                include: {
                    user: true,
                },
            },
            resolvedByMembership: {
                include: {
                    user: true,
                },
            },
            reservation: true,
            vehicleIssueAttachments: {
                include: {
                    fileAttachment: true,
                },
            },
        };
    }

    private getOrderBy(sort?: string) {
        switch (sort) {
            case 'createdAt':
                return { createdAt: 'asc' as const };
            case '-createdAt':
                return { createdAt: 'desc' as const };
            case 'resolvedAt':
                return { resolvedAt: 'asc' as const };
            case '-resolvedAt':
                return { resolvedAt: 'desc' as const };
            default:
                return { createdAt: 'desc' as const };
        }
    }
}