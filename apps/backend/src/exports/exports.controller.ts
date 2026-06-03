
import { Controller, Get, Header, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportsService } from './exports.service';
import { ExportTripLogsQueryDto } from './dto/export-trip-logs-query.dto';

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        membershipId: string;
        organizationId: string;
        role: string;
    };
};

@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
    constructor(private readonly exportsService: ExportsService) {}

    @Get('trip-logs')
    async exportTripLogs(
        @Req() request: AuthenticatedRequest,
        @Query() query: ExportTripLogsQueryDto,
        @Res() response: Response,
    ) {
        const result = await this.exportsService.exportTripLogs(
            request.user,
            query,
        );

        response.setHeader('Content-Type', result.contentType);
        response.setHeader(
            'Content-Disposition',
            `attachment; filename="${result.fileName}"`,
        );

        return response.send(result.content);
    }
}