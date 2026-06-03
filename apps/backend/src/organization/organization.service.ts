import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {PrismaService} from '../database/prisma.service';
import {UpdateOrganizationDto} from './dto/update-organization.dto';

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class OrganizationService {
    constructor(private readonly prisma: PrismaService) {
    }

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
}