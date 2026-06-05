import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../database/prisma.service';
import {AvailabilityService} from '../availability/availability.service';
import {CreateVehicleDto} from './dto/create-vehicle.dto';
import {UpdateVehicleDto} from './dto/update-vehicle.dto';
import {AvailableVehiclesQueryDto} from './dto/available-vehicles-query.dto';
import {FindVehiclesQueryDto} from "./dto/find-vehicles-query.dto";
import {CreateReservationIssueDto} from "../vehicle-issues/dto/create-reservation-issue.dto";
import {buildPaginationMeta, getPagination} from "../common/pagination";
import {AuditService} from "../audit/audit.service";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class VehiclesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly availabilityService: AvailabilityService,
        private readonly auditService: AuditService,
    ) {
    }

    async create(currentUser: CurrentUser, dto: CreateVehicleDto) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can create vehicles.');
        }

        const existingVehicleByLicensePlate = await this.prisma.vehicle.findFirst({
            where: {
                organizationId: currentUser.organizationId,
                licensePlate: dto.licensePlate,
            },
        });

        if (existingVehicleByLicensePlate) {
            throw new ConflictException('Vehicle with this license plate already exists.');
        }

        if (dto.vin) {
            const existingVehicleByVin = await this.prisma.vehicle.findFirst({
                where: {
                    organizationId: currentUser.organizationId,
                    vin: dto.vin,
                },
            });

            if (existingVehicleByVin) {
                throw new ConflictException('Vehicle with this VIN already exists.');
            }
        }

        await this.validateManagerMembership(
            currentUser.organizationId,
            dto.managerMemberId,
        );

        const vehicle = await this.prisma.vehicle.create({
            data: {
                organizationId: currentUser.organizationId,
                managerMembershipId: dto.managerMemberId,
                name: dto.name,
                licensePlate: dto.licensePlate,
                brand: dto.brand,
                model: dto.model,
                vin: dto.vin,
                fuelType: dto.fuelType,
                currentOdometerKm: dto.currentOdometerKm,
                status: 'ACTIVE',
                note: dto.note,
            },
        });

        return this.toVehicleResponse(vehicle);
    }

    async findAll(currentUser: CurrentUser, query: FindVehiclesQueryDto) {
        const scope = query.scope ?? (currentUser.role === 'ADMIN' ? 'all' : 'managed');

        if (!['all', 'managed'].includes(scope)) {
            throw new BadRequestException('Invalid vehicle scope.');
        }

        if (scope === 'all' && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can view all vehicles.');
        }

        if (query.managerId && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can filter by manager.');
        }

        const where: any = {
            organizationId: currentUser.organizationId,
        };

        if (scope === 'managed') {
            where.managerMembershipId =
                currentUser.role === 'ADMIN' && query.managerId
                    ? query.managerId
                    : currentUser.membershipId;
        }

        if (scope === 'all' && query.managerId) {
            where.managerMembershipId = query.managerId;
        }

        if (query.status) {
            where.status = query.status;
        } else if (query.includeArchived !== 'true') {
            where.status = {
                not: 'ARCHIVED',
            };
        }

        if (query.brand) {
            where.brand = query.brand;
        }

        if (query.search) {
            where.OR = [
                {
                    name: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
                {
                    licensePlate: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
                {
                    brand: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
                {
                    model: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        const {page, limit, skip, take} = getPagination(query);

        const [vehicles, total] = await this.prisma.$transaction([
            this.prisma.vehicle.findMany({
                where,
                include: {
                    managerMembership: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: this.getOrderBy(query.sort),
                skip,
                take,
            }),
            this.prisma.vehicle.count({
                where,
            }),
        ]);

        return {
            data: vehicles.map((vehicle) => this.toVehicleResponse(vehicle)),
            pagination: buildPaginationMeta({
                page,
                limit,
                total,
            }),
        };
    }

    private toVehicleResponse(vehicle: any) {
        return {
            id: vehicle.id,
            name: vehicle.name,
            licensePlate: vehicle.licensePlate,
            brand: vehicle.brand,
            model: vehicle.model,
            vin: vehicle.vin,
            fuelType: vehicle.fuelType,
            currentOdometerKm: vehicle.currentOdometerKm,
            status: vehicle.status,
            managerMemberId: vehicle.managerMembershipId,
            manager: vehicle.managerMembership
                ? {
                    id: vehicle.managerMembership.id,
                    name: vehicle.managerMembership.user.name,
                }
                : null,
            note: vehicle.note,
            archivedAt: vehicle.archivedAt,
            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt,
        };
    }

    async findOne(currentUser: CurrentUser, vehicleId: string) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId: currentUser.organizationId,
            },
            include: {
                managerMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            vehicle.managerMembershipId === currentUser.membershipId;

        if (!isAdmin && !isVehicleManager) {
            throw new ForbiddenException('You cannot view this vehicle.');
        }

        return this.toVehicleResponse(vehicle);
    }

    async update(
        currentUser: CurrentUser,
        vehicleId: string,
        dto: UpdateVehicleDto,
    ) {
        const existingVehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId: currentUser.organizationId,
            },
            include: {
                managerMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!existingVehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            existingVehicle.managerMembershipId === currentUser.membershipId;

        if (!isAdmin && !isVehicleManager) {
            throw new ForbiddenException('You cannot update this vehicle.');
        }

        if (!isAdmin) {
            const forbiddenFieldsForManager = [
                dto.name,
                dto.licensePlate,
                dto.brand,
                dto.model,
                dto.vin,
                dto.fuelType,
                dto.managerMemberId,
            ].some((value) => value !== undefined);

            if (forbiddenFieldsForManager) {
                throw new ForbiddenException(
                    'Vehicle manager can update only currentOdometerKm, status and note.',
                );
            }

            if (
                dto.status !== undefined &&
                !['ACTIVE', 'UNAVAILABLE'].includes(dto.status)
            ) {
                throw new ForbiddenException(
                    'Vehicle manager can set only ACTIVE or UNAVAILABLE status.',
                );
            }
        }

        if (
            dto.licensePlate &&
            dto.licensePlate !== existingVehicle.licensePlate
        ) {
            const vehicleWithSameLicensePlate = await this.prisma.vehicle.findFirst({
                where: {
                    organizationId: currentUser.organizationId,
                    licensePlate: dto.licensePlate,
                    NOT: {
                        id: vehicleId,
                    },
                },
            });

            if (vehicleWithSameLicensePlate) {
                throw new ConflictException(
                    'Vehicle with this license plate already exists.',
                );
            }
        }

        if (dto.vin && dto.vin !== existingVehicle.vin) {
            const vehicleWithSameVin = await this.prisma.vehicle.findFirst({
                where: {
                    organizationId: currentUser.organizationId,
                    vin: dto.vin,
                    NOT: {
                        id: vehicleId,
                    },
                },
            });

            if (vehicleWithSameVin) {
                throw new ConflictException('Vehicle with this VIN already exists.');
            }
        }

        await this.validateManagerMembership(
            currentUser.organizationId,
            dto.managerMemberId,
        );

        const oldValues = {
            name: existingVehicle.name,
            licensePlate: existingVehicle.licensePlate,
            brand: existingVehicle.brand,
            model: existingVehicle.model,
            vin: existingVehicle.vin,
            fuelType: existingVehicle.fuelType,
            currentOdometerKm: existingVehicle.currentOdometerKm,
            status: existingVehicle.status,
            managerMemberId: existingVehicle.managerMembershipId,
            note: existingVehicle.note,
        };

        const now = new Date();

        const result = await this.prisma.$transaction(async (tx) => {
            const updatedVehicle = await tx.vehicle.update({
                where: {
                    id: vehicleId,
                },
                data: {
                    name: dto.name,
                    licensePlate: dto.licensePlate,
                    brand: dto.brand,
                    model: dto.model,
                    vin: dto.vin,
                    fuelType: dto.fuelType,
                    currentOdometerKm: dto.currentOdometerKm,
                    status: dto.status,
                    managerMembershipId: dto.managerMemberId,
                    note: dto.note,
                    updatedAt: now,
                },
                include: {
                    managerMembership: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            const shouldCancelFutureReservations =
                dto.status === 'UNAVAILABLE' &&
                existingVehicle.status !== 'UNAVAILABLE';

            const cancelledReservations = shouldCancelFutureReservations
                ? await tx.reservation.updateMany({
                    where: {
                        vehicleId: existingVehicle.id,
                        status: 'ACTIVE',
                        startAt: {
                            gt: now,
                        },
                    },
                    data: {
                        status: 'CANCELLED',
                        cancelledAt: now,
                        cancelledByMembershipId: currentUser.membershipId,
                        updatedAt: now,
                    },
                })
                : {count: 0};

            return {
                updatedVehicle,
                cancelledFutureReservationsCount: cancelledReservations.count,
            };
        });

        const updatedVehicle = result.updatedVehicle;

        const newValues = {
            name: updatedVehicle.name,
            licensePlate: updatedVehicle.licensePlate,
            brand: updatedVehicle.brand,
            model: updatedVehicle.model,
            vin: updatedVehicle.vin,
            fuelType: updatedVehicle.fuelType,
            currentOdometerKm: updatedVehicle.currentOdometerKm,
            status: updatedVehicle.status,
            managerMemberId: updatedVehicle.managerMembershipId,
            note: updatedVehicle.note,
            cancelledFutureReservationsCount:
            result.cancelledFutureReservationsCount,
        };

        await this.auditService.create({
            organizationId: currentUser.organizationId,
            actorMembershipId: currentUser.membershipId,
            action: 'VEHICLE_UPDATED',
            entityType: 'Vehicle',
            entityId: updatedVehicle.id,
            oldValues,
            newValues,
        });

        return {
            ...this.toVehicleResponse(updatedVehicle),
            cancelledFutureReservationsCount: result.cancelledFutureReservationsCount,
        };
    }

    async findAvailable(
        currentUser: CurrentUser,
        query: AvailableVehiclesQueryDto,
    ) {
        const startAt = new Date(query.startAt);
        const endAt = new Date(query.endAt);

        const vehicles = await this.availabilityService.findAvailableVehicles(
            currentUser.organizationId,
            startAt,
            endAt,
        );

        const {page, limit, skip, take} = getPagination(query);
        const paginatedVehicles = vehicles.slice(skip, skip + take);

        return {
            data: paginatedVehicles,
            pagination: buildPaginationMeta({
                page,
                limit,
                total: vehicles.length,
            }),
        };
    }

    async archive(currentUser: CurrentUser, vehicleId: string) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can archive vehicles.');
        }

        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId: currentUser.organizationId,
            },
            include: {
                managerMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        if (vehicle.status === 'ARCHIVED') {
            return {
                ...this.toVehicleResponse(vehicle),
                cancelledFutureReservationsCount: 0,
            };
        }

        const oldValues = {
            status: vehicle.status,
            archivedAt: vehicle.archivedAt,
        };

        const now = new Date();

        const result = await this.prisma.$transaction(async (tx) => {
            const cancelledReservations = await tx.reservation.updateMany({
                where: {
                    vehicleId: vehicle.id,
                    status: 'ACTIVE',
                    startAt: {
                        gt: now,
                    },
                },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: now,
                    cancelledByMembershipId: currentUser.membershipId,
                    updatedAt: now,
                },
            });

            const archivedVehicle = await tx.vehicle.update({
                where: {
                    id: vehicle.id,
                },
                data: {
                    status: 'ARCHIVED',
                    archivedAt: now,
                    updatedAt: now,
                },
                include: {
                    managerMembership: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            return {
                archivedVehicle,
                cancelledFutureReservationsCount: cancelledReservations.count,
            };
        });

        const newValues = {
            status: result.archivedVehicle.status,
            archivedAt: result.archivedVehicle.archivedAt,
            cancelledFutureReservationsCount:
            result.cancelledFutureReservationsCount,
        };

        await this.auditService.create({
            organizationId: currentUser.organizationId,
            actorMembershipId: currentUser.membershipId,
            action: 'VEHICLE_ARCHIVED',
            entityType: 'Vehicle',
            entityId: result.archivedVehicle.id,
            oldValues,
            newValues,
        });

        return {
            ...this.toVehicleResponse(result.archivedVehicle),
            cancelledFutureReservationsCount:
            result.cancelledFutureReservationsCount,
        };
    }

    async createIssue(
        currentUser: CurrentUser,
        vehicleId: string,
        dto: CreateReservationIssueDto,
    ) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId: currentUser.organizationId,
                status: {
                    not: 'ARCHIVED',
                },
            },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        if (dto.photoFileIds?.length) {
            const files = await this.prisma.fileAttachment.findMany({
                where: {
                    id: {
                        in: dto.photoFileIds,
                    },
                    organizationId: currentUser.organizationId,
                    deletedAt: null,
                },
            });

            if (files.length !== dto.photoFileIds.length) {
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

        const issue = await this.prisma.vehicleIssue.create({
            data: {
                vehicleId: vehicle.id,
                reservationId: null,
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
            include: {
                vehicle: true,
                reservation: true,
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
                vehicleIssueAttachments: {
                    include: {
                        fileAttachment: true,
                    },
                },
            },
        });

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

    private async validateManagerMembership(
        organizationId: string,
        managerMemberId?: string | null,
    ) {
        if (managerMemberId === undefined || managerMemberId === null) {
            return;
        }

        const managerMembership = await this.prisma.membership.findFirst({
            where: {
                id: managerMemberId,
                organizationId,
            },
        });

        if (!managerMembership) {
            throw new NotFoundException('Vehicle manager was not found.');
        }

        if (managerMembership.status !== 'ACTIVE') {
            throw new BadRequestException('Vehicle manager must be an active member.');
        }
    }

    private getOrderBy(sort?: string) {
        switch (sort) {
            case 'name':
                return [{name: 'asc' as const}];
            case '-name':
                return [{name: 'desc' as const}];
            case 'licensePlate':
                return [{licensePlate: 'asc' as const}];
            case '-licensePlate':
                return [{licensePlate: 'desc' as const}];
            case 'brand':
                return [{brand: 'asc' as const}, {name: 'asc' as const}];
            case '-brand':
                return [{brand: 'desc' as const}, {name: 'asc' as const}];
            case 'status':
                return [{status: 'asc' as const}, {name: 'asc' as const}];
            case '-status':
                return [{status: 'desc' as const}, {name: 'asc' as const}];
            case 'createdAt':
                return [{createdAt: 'asc' as const}];
            case '-createdAt':
                return [{createdAt: 'desc' as const}];
            default:
                return [{status: 'asc' as const}, {name: 'asc' as const}];
        }
    }
}