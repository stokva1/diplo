import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import {PrismaService} from '../database/prisma.service';
import {UploadFileDto} from "./dto/upload-file.dto";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class FilesService {
    constructor(private readonly prisma: PrismaService) {
    }

    async create(
        currentUser: CurrentUser,
        file: Express.Multer.File,
        dto: UploadFileDto,
    ) {
        const purpose = dto.purpose ?? 'OTHER';

        try {
            this.assertAllowedMimeTypeForPurpose(purpose, file.mimetype);
        } catch (error) {
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            throw error;
        }

        const fileAttachment = await this.prisma.fileAttachment.create({
            data: {
                organizationId: currentUser.organizationId,
                uploadedByMembershipId: currentUser.membershipId,
                fileName: file.originalname,
                mimeType: file.mimetype,
                fileSizeBytes: file.size,
                storageKey: file.path,
                purpose,
            },
        });

        return this.toFileResponse(fileAttachment);
    }

    async findOne(currentUser: CurrentUser, fileId: string) {
        const fileAttachment = await this.prisma.fileAttachment.findFirst({
            where: {
                id: fileId,
                organizationId: currentUser.organizationId,
                deletedAt: null,
            },
        });

        if (!fileAttachment) {
            throw new NotFoundException('File not found.');
        }

        await this.assertCanAccessFile(currentUser, fileAttachment.id);

        if (!fs.existsSync(fileAttachment.storageKey)) {
            throw new NotFoundException('File content not found.');
        }

        return fileAttachment;
    }

    private toFileResponse(file: any) {
        return {
            id: file.id,
            fileName: file.fileName,
            mimeType: file.mimeType,
            fileSizeBytes: file.fileSizeBytes,
            purpose: file.purpose,
            createdAt: file.createdAt,
        };
    }

    private assertAllowedMimeTypeForPurpose(
        purpose: string,
        mimeType: string,
    ) {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const documentMimeTypes = [...imageMimeTypes, 'application/pdf'];

        const allowedMimeTypesByPurpose: Record<string, string[]> = {
            FUEL_RECEIPT: documentMimeTypes,
            ISSUE_PHOTO: imageMimeTypes,
            SERVICE_INVOICE: documentMimeTypes,
            OTHER: documentMimeTypes,
        };

        const allowedMimeTypes = allowedMimeTypesByPurpose[purpose];

        if (!allowedMimeTypes || !allowedMimeTypes.includes(mimeType)) {
            throw new BadRequestException(
                `Unsupported file type for purpose ${purpose}.`,
            );
        }
    }

    async findMetadata(currentUser: CurrentUser, fileId: string) {
        const fileAttachment = await this.prisma.fileAttachment.findFirst({
            where: {
                id: fileId,
                organizationId: currentUser.organizationId,
                deletedAt: null,
            },
        });

        if (!fileAttachment) {
            throw new NotFoundException('File not found.');
        }

        await this.assertCanAccessFile(currentUser, fileAttachment.id);

        return this.toFileResponse(fileAttachment);
    }

    async delete(currentUser: CurrentUser, fileId: string) {
        const file = await this.prisma.fileAttachment.findFirst({
            where: {
                id: fileId,
                organizationId: currentUser.organizationId,
                deletedAt: null,
            },
        });

        if (!file) {
            throw new NotFoundException('File not found.');
        }

        const isAdmin = currentUser.role === 'ADMIN';
        const isOwner = file.uploadedByMembershipId === currentUser.membershipId;

        if (!isAdmin && !isOwner) {
            throw new ForbiddenException('You cannot delete this file.');
        }

        await this.assertFileIsNotAttached(file.id);

        await this.prisma.fileAttachment.update({
            where: {
                id: file.id,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    private async assertFileIsNotAttached(fileId: string) {
        const [tripLog, issueAttachment, serviceEvent] = await Promise.all([
            this.prisma.tripLog.findFirst({
                where: {
                    refuelingReceiptFileId: fileId,
                },
                select: {
                    id: true,
                },
            }),
            this.prisma.vehicleIssueAttachment.findFirst({
                where: {
                    fileAttachmentId: fileId,
                },
                select: {
                    id: true,
                },
            }),
            this.prisma.serviceEvent.findFirst({
                where: {
                    invoiceFileId: fileId,
                },
                select: {
                    id: true,
                },
            }),
        ]);

        if (tripLog || issueAttachment || serviceEvent) {
            throw new ConflictException(
                'File is attached to another record and cannot be deleted.',
            );
        }
    }

    private async assertCanAccessFile(
        currentUser: CurrentUser,
        fileId: string,
    ) {
        if (currentUser.role === 'ADMIN') {
            return;
        }

        const [
            tripLog,
            issueAttachment,
            serviceEvent,
            file,
        ] = await Promise.all([
            this.prisma.tripLog.findFirst({
                where: {
                    refuelingReceiptFileId: fileId,
                    reservation: {
                        vehicle: {
                            organizationId: currentUser.organizationId,
                        },
                    },
                },
                include: {
                    reservation: {
                        include: {
                            vehicle: true,
                        },
                    },
                },
            }),
            this.prisma.vehicleIssueAttachment.findFirst({
                where: {
                    fileAttachmentId: fileId,
                    vehicleIssue: {
                        vehicle: {
                            organizationId: currentUser.organizationId,
                        },
                    },
                },
                include: {
                    vehicleIssue: {
                        include: {
                            vehicle: true,
                        },
                    },
                },
            }),
            this.prisma.serviceEvent.findFirst({
                where: {
                    invoiceFileId: fileId,
                    vehicle: {
                        organizationId: currentUser.organizationId,
                    },
                },
                include: {
                    vehicle: true,
                },
            }),
            this.prisma.fileAttachment.findFirst({
                where: {
                    id: fileId,
                    organizationId: currentUser.organizationId,
                    deletedAt: null,
                },
            }),
        ]);

        if (tripLog) {
            const isReservationOwner =
                tripLog.reservation.membershipId === currentUser.membershipId;

            const isVehicleManager =
                tripLog.reservation.vehicle.managerMembershipId ===
                currentUser.membershipId;

            if (isReservationOwner || isVehicleManager) {
                return;
            }

            throw new ForbiddenException('You cannot access this file.');
        }

        if (issueAttachment) {
            const issue = issueAttachment.vehicleIssue;

            const isReporter =
                issue.reportedByMembershipId === currentUser.membershipId;

            const isVehicleManager =
                issue.vehicle.managerMembershipId === currentUser.membershipId;

            if (isReporter || isVehicleManager) {
                return;
            }

            throw new ForbiddenException('You cannot access this file.');
        }

        if (serviceEvent) {
            const isVehicleManager =
                serviceEvent.vehicle.managerMembershipId === currentUser.membershipId;

            if (isVehicleManager) {
                return;
            }

            throw new ForbiddenException('You cannot access this file.');
        }

        if (!file) {
            throw new NotFoundException('File not found.');
        }

        const isOwner = file.uploadedByMembershipId === currentUser.membershipId;

        if (!isOwner) {
            throw new ForbiddenException('You cannot access this file.');
        }
    }
}