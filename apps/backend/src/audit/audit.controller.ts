import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { FindAuditLogsQueryDto } from './dto/find-audit-logs-query.dto';

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    @Get()
    findAll(
        @Req() request: AuthenticatedRequest,
        @Query() query: FindAuditLogsQueryDto,
    ) {
        return this.auditService.findAll(request.user, query);
    }
}