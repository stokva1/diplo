import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import {AuditService} from "../audit/audit.service";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class SettingsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {}

    async findOne(currentUser: CurrentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can view organization settings.',
            );
        }

        const settings = await this.prisma.organizationSettings.findUnique({
            where: {
                organizationId: currentUser.organizationId,
            },
        });

        if (!settings) {
            throw new NotFoundException('Organization settings not found.');
        }

        return this.toResponse(settings);
    }

    async update(currentUser: CurrentUser, dto: UpdateOrganizationSettingsDto) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can update organization settings.',
            );
        }

        const existingSettings = await this.prisma.organizationSettings.findUnique({
            where: {
                organizationId: currentUser.organizationId,
            },
        });

        if (!existingSettings) {
            throw new NotFoundException('Organization settings not found.');
        }

        const oldValues = {
            tripLogRetentionMonths: existingSettings.tripLogRetentionMonths,
            issuePhotoRetentionMonths: existingSettings.issuePhotoRetentionMonths,
        };

        const settings = await this.prisma.organizationSettings.update({
            where: {
                organizationId: currentUser.organizationId,
            },
            data: {
                tripLogRetentionMonths: dto.tripLogRetentionMonths,
                issuePhotoRetentionMonths: dto.issuePhotoRetentionMonths,
                updatedAt: new Date(),
            },
        });

        const newValues = {
            tripLogRetentionMonths: settings.tripLogRetentionMonths,
            issuePhotoRetentionMonths: settings.issuePhotoRetentionMonths,
        };

        await this.auditService.create({
            organizationId: currentUser.organizationId,
            actorMembershipId: currentUser.membershipId,
            action: 'ORGANIZATION_SETTINGS_UPDATED',
            entityType: 'OrganizationSettings',
            entityId: settings.id,
            oldValues,
            newValues,
        });

        return this.toResponse(settings);
    }

    private toResponse(settings: any) {
        return {
            tripLogRetentionMonths: settings.tripLogRetentionMonths,
            issuePhotoRetentionMonths: settings.issuePhotoRetentionMonths,
        };
    }
}