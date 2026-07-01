import {
    BadRequestException, ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {AvailabilityService} from '../availability/availability.service';
import {PrismaService} from '../database/prisma.service';
import {CreateServiceEventDto} from './dto/create-service-event.dto';
import {UpdateServiceEventDto} from "./dto/update-service-event.dto";
import {FindServiceEventsQueryDto} from "./dto/find-service-events-query.dto";
import {buildPaginationMeta, getPagination} from "../common/pagination";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class ServiceEventsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly availabilityService: AvailabilityService,
    ) {
    }

    async create(
        currentUser: CurrentUser,
        vehicleId: string,
        dto: CreateServiceEventDto,
    ) {
        const startAt = new Date(dto.startAt);
        const endAt = new Date(dto.endAt);

        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId: currentUser.organizationId,
            },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            vehicle.managerMembershipId === currentUser.membershipId;

        if (!isAdmin && !isVehicleManager) {
            throw new ForbiddenException(
                'Only administrator or vehicle manager can create service event.',
            );
        }

        await this.availabilityService.assertServiceEventDoesNotCollideWithReservations(
            currentUser.organizationId,
            vehicleId,
            startAt,
            endAt,
        );

        if (dto.invoiceFileId) {
            const file = await this.prisma.fileAttachment.findFirst({
                where: {
                    id: dto.invoiceFileId,
                    organizationId: currentUser.organizationId,
                    deletedAt: null,
                },
            });

            if (!file) {
                throw new NotFoundException('Invoice file not found.');
            }

            if (file.purpose !== 'SERVICE_INVOICE') {
                throw new BadRequestException(
                    'Invoice file must be uploaded with purpose SERVICE_INVOICE.',
                );
            }
        }

        const serviceEvent = await this.prisma.serviceEvent.create({
            data: {
                vehicleId,
                createdByMembershipId: currentUser.membershipId,
                title: dto.title,
                description: dto.description,
                startAt,
                endAt,
                cost: dto.cost,
                invoiceFileId: dto.invoiceFileId,
                status: 'ACTIVE',
            },
            include: {
                vehicle: true,
                invoiceFile: true,
                createdByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return this.toServiceEventResponse(serviceEvent);
    }

    private toServiceEventResponse(serviceEvent: any) {
        return {
            id: serviceEvent.id,
            vehicle: {
                id: serviceEvent.vehicle.id,
                name: serviceEvent.vehicle.name,
                licensePlate: serviceEvent.vehicle.licensePlate,
            },
            createdBy: {
                id: serviceEvent.createdByMembership.id,
                name: serviceEvent.createdByMembership.user.name,
                email: serviceEvent.createdByMembership.user.email,
            },
            title: serviceEvent.title,
            description: serviceEvent.description,
            startAt: serviceEvent.startAt,
            endAt: serviceEvent.endAt,
            cost: serviceEvent.cost,
            invoiceFile: serviceEvent.invoiceFile
                ? {
                    id: serviceEvent.invoiceFile.id,
                    fileName: serviceEvent.invoiceFile.fileName,
                }
                : null,
            status: serviceEvent.status,
            cancelledAt: serviceEvent.cancelledAt,
            cancelledByMembershipId: serviceEvent.cancelledByMembershipId,
            createdAt: serviceEvent.createdAt,
            updatedAt: serviceEvent.updatedAt,
        };
    }

    async findAll(currentUser: CurrentUser, query: FindServiceEventsQueryDto) {
        const scope = query.scope ?? 'managed';

        if (!['managed', 'all'].includes(scope)) {
            throw new BadRequestException('Invalid service event scope.');
        }

        if (scope === 'all' && currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can view all service events.',
            );
        }

        const where: any =
            scope === 'all'
                ? {
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                }
                : {
                    vehicle: {
                        organizationId: currentUser.organizationId,
                        managerMembershipId: currentUser.membershipId,
                    },
                };

        if (query.vehicleId) {
            where.vehicleId = query.vehicleId;
        }

        if (query.from || query.to) {
            where.startAt = {};

            if (query.from) {
                where.startAt.gte = new Date(query.from);
            }

            if (query.to) {
                where.startAt.lte = new Date(query.to);
            }
        }

        const {page, limit, skip, take} = getPagination(query);

        const [serviceEvents, total] = await this.prisma.$transaction([
            this.prisma.serviceEvent.findMany({
                where,
                include: {
                    vehicle: true,
                    invoiceFile: true,
                    createdByMembership: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: this.getOrderBy(query.sort),
                skip,
                take,
            }),
            this.prisma.serviceEvent.count({
                where,
            }),
        ]);

        return {
            data: serviceEvents.map((serviceEvent) =>
                this.toServiceEventResponse(serviceEvent),
            ),
            pagination: buildPaginationMeta({
                page,
                limit,
                total,
            }),
        };
    }

    async findByVehicle(
        currentUser: CurrentUser,
        vehicleId: string,
        query: FindServiceEventsQueryDto,
    ) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                organizationId: currentUser.organizationId,
            },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager = vehicle.managerMembershipId === currentUser.membershipId;

        if (!isAdmin && !isVehicleManager) {
            throw new ForbiddenException(
                'Only administrator or vehicle manager can view vehicle service events.',
            );
        }

        const where: any = {
            vehicleId,
        };

        if (query.from || query.to) {
            where.startAt = {};

            if (query.from) {
                where.startAt.gte = new Date(query.from);
            }

            if (query.to) {
                where.startAt.lte = new Date(query.to);
            }
        }

        const {page, limit, skip, take} = getPagination(query);

        const [serviceEvents, total] = await this.prisma.$transaction([
            this.prisma.serviceEvent.findMany({
                where,
                include: {
                    vehicle: true,
                    invoiceFile: true,
                    createdByMembership: {
                        include: {
                            user: true,
                        },
                    },
                },
                orderBy: this.getOrderBy(query.sort),
                skip,
                take,
            }),
            this.prisma.serviceEvent.count({
                where,
            }),
        ]);

        return {
            data: serviceEvents.map((serviceEvent) =>
                this.toServiceEventResponse(serviceEvent),
            ),
            pagination: buildPaginationMeta({
                page,
                limit,
                total,
            }),
        };
    }

    async findOne(currentUser: CurrentUser, serviceEventId: string) {
        const serviceEvent = await this.prisma.serviceEvent.findFirst({
            where: {
                id: serviceEventId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                invoiceFile: true,
                createdByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!serviceEvent) {
            throw new NotFoundException('Service event not found.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            serviceEvent.vehicle.managerMembershipId === currentUser.membershipId;

        if (!isAdmin && !isVehicleManager) {
            throw new ForbiddenException(
                'Only administrator or vehicle manager can view service event.',
            );
        }

        return this.toServiceEventResponse(serviceEvent);
    }

    async update(
        currentUser: CurrentUser,
        serviceEventId: string,
        dto: UpdateServiceEventDto,
    ) {
        const serviceEvent = await this.prisma.serviceEvent.findFirst({
            where: {
                id: serviceEventId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                invoiceFile: true,
                createdByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!serviceEvent) {
            throw new NotFoundException('Service event not found.');
        }

        if (serviceEvent.status === 'CANCELLED') {
            throw new ConflictException('Cancelled service event cannot be updated.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            serviceEvent.vehicle.managerMembershipId === currentUser.membershipId;

        if (!isAdmin && !isVehicleManager) {
            throw new ForbiddenException(
                'Only administrator or vehicle manager can update service event.',
            );
        }

        const nextStartAt = dto.startAt ? new Date(dto.startAt) : serviceEvent.startAt;
        const nextEndAt = dto.endAt ? new Date(dto.endAt) : serviceEvent.endAt;

        if (nextEndAt <= nextStartAt) {
            throw new BadRequestException('endAt must be after startAt.');
        }

        const changesAvailability =
            nextStartAt.getTime() !== serviceEvent.startAt.getTime() ||
            nextEndAt.getTime() !== serviceEvent.endAt.getTime();

        if (changesAvailability) {
            await this.availabilityService.assertServiceEventDoesNotCollideWithReservations(
                currentUser.organizationId,
                serviceEvent.vehicleId,
                nextStartAt,
                nextEndAt,
                serviceEvent.id,
            );
        }

        if (dto.invoiceFileId) {
            const file = await this.prisma.fileAttachment.findFirst({
                where: {
                    id: dto.invoiceFileId,
                    organizationId: currentUser.organizationId,
                    deletedAt: null,
                },
            });

            if (!file) {
                throw new NotFoundException('Invoice file not found.');
            }

            if (file.purpose !== 'SERVICE_INVOICE') {
                throw new BadRequestException(
                    'Invoice file must be uploaded with purpose SERVICE_INVOICE.',
                );
            }
        }

        const shouldReplaceInvoice =
            dto.invoiceFileId !== undefined &&
            dto.invoiceFileId !== serviceEvent.invoiceFileId;

        const oldInvoiceFile = shouldReplaceInvoice
            ? serviceEvent.invoiceFile
            : null;

        const updatedServiceEvent = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.serviceEvent.update({
                where: {
                    id: serviceEvent.id,
                },
                data: {
                    title: dto.title,
                    description: dto.description,
                    startAt: dto.startAt ? nextStartAt : undefined,
                    endAt: dto.endAt ? nextEndAt : undefined,
                    cost: dto.cost,
                    invoiceFileId: dto.invoiceFileId,
                    updatedAt: new Date(),
                },
                include: {
                    vehicle: true,
                    invoiceFile: true,
                    createdByMembership: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            if (oldInvoiceFile) {
                await tx.fileAttachment.update({
                    where: {
                        id: oldInvoiceFile.id,
                    },
                    data: {
                        deletedAt: new Date(),
                    },
                });
            }

            return updated;
        });

        return this.toServiceEventResponse(updatedServiceEvent);
    }

    async cancel(currentUser: CurrentUser, serviceEventId: string) {
        const serviceEvent = await this.prisma.serviceEvent.findFirst({
            where: {
                id: serviceEventId,
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
            include: {
                vehicle: true,
                invoiceFile: true,
                createdByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!serviceEvent) {
            throw new NotFoundException('Service event not found.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isVehicleManager =
            serviceEvent.vehicle.managerMembershipId === currentUser.membershipId;

        if (!isAdmin && !isVehicleManager) {
            throw new ForbiddenException(
                'Only administrator or vehicle manager can cancel service event.',
            );
        }

        if (serviceEvent.status === 'CANCELLED') {
            return this.toServiceEventResponse(serviceEvent);
        }

        const cancelledServiceEvent = await this.prisma.serviceEvent.update({
            where: {
                id: serviceEvent.id,
            },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelledByMembershipId: currentUser.membershipId,
                updatedAt: new Date(),
            },
            include: {
                vehicle: true,
                invoiceFile: true,
                createdByMembership: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return this.toServiceEventResponse(cancelledServiceEvent);
    }

    private getOrderBy(sort?: string) {
        switch (sort) {
            case 'startAt':
                return {startAt: 'asc' as const};
            case '-startAt':
                return {startAt: 'desc' as const};
            case 'endAt':
                return {endAt: 'asc' as const};
            case '-endAt':
                return {endAt: 'desc' as const};
            case 'createdAt':
                return {createdAt: 'asc' as const};
            case '-createdAt':
                return {createdAt: 'desc' as const};
            default:
                return {startAt: 'desc' as const};
        }
    }
}