import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import {UpdateOrganizationSettingsDto} from "./dto/update-organization-settings.dto";

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class OrganizationService {
    constructor(private readonly prisma: PrismaService) {}

    async findOne(currentUser: CurrentUser) {
        const organization = await this.prisma.organization.findUnique({
            where: {
                id: currentUser.organizationId,
            },
        });

        if (!organization) {
            throw new NotFoundException('Organization not found.');
        }

        return this.toOrganizationResponse(organization);
    }

    async update(currentUser: CurrentUser, dto: UpdateOrganizationDto) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can update organization.');
        }

        const organization = await this.prisma.organization.update({
            where: {
                id: currentUser.organizationId,
            },
            data: {
                name: dto.name,
                ico: dto.ico,
                contactEmail: dto.contactEmail,
                updatedAt: new Date(),
            },
        });

        return this.toOrganizationResponse(organization);
    }

    private toOrganizationResponse(organization: any) {
        return {
            id: organization.id,
            name: organization.name,
            ico: organization.ico,
            contactEmail: organization.contactEmail,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt,
        };
    }

    async findSettings(currentUser: CurrentUser) {
        const settings = await this.prisma.organizationSettings.findUnique({
            where: {
                organizationId: currentUser.organizationId,
            },
        });

        if (!settings) {
            throw new NotFoundException('Organization settings not found.');
        }

        return this.toOrganizationSettingsResponse(settings);
    }

    async updateSettings(
        currentUser: CurrentUser,
        dto: UpdateOrganizationSettingsDto,
    ) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrator can update organization settings.',
            );
        }

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

        return this.toOrganizationSettingsResponse(settings);
    }

    private toOrganizationSettingsResponse(settings: any) {
        return {
            id: settings.id,
            organizationId: settings.organizationId,
            tripLogRetentionMonths: settings.tripLogRetentionMonths,
            issuePhotoRetentionMonths: settings.issuePhotoRetentionMonths,
            createdAt: settings.createdAt,
            updatedAt: settings.updatedAt,
        };
    }
}