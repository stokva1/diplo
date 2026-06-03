import {
    BadRequestException,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../database/prisma.service';
import { ExportTripLogsQueryDto } from './dto/export-trip-logs-query.dto';

type CurrentUser = {
    userId: string;
    membershipId: string;
    organizationId: string;
    role: string;
};

@Injectable()
export class ExportsService {
    constructor(private readonly prisma: PrismaService) {}

    async exportTripLogs(currentUser: CurrentUser, query: ExportTripLogsQueryDto) {
        if (currentUser.role !== 'ADMIN') {
            throw new ForbiddenException('Only administrator can export trip logs.');
        }

        if (!['csv', 'xlsx'].includes(query.format)) {
            throw new BadRequestException('Unsupported export format.');
        }

        const where: any = {
            reservation: {
                vehicle: {
                    organizationId: currentUser.organizationId,
                },
            },
        };

        if (query.vehicleId) {
            where.reservation.vehicleId = query.vehicleId;
        }

        if (query.memberId) {
            where.reservation.membershipId = query.memberId;
        }

        if (query.from || query.to) {
            where.reservation.startAt = {};

            if (query.from) {
                where.reservation.startAt.gte = new Date(query.from);
            }

            if (query.to) {
                where.reservation.startAt.lte = new Date(query.to);
            }
        }

        const tripLogs = await this.prisma.tripLog.findMany({
            where,
            include: {
                reservation: {
                    include: {
                        vehicle: true,
                        membership: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                completedAt: 'asc',
            },
        });

        if (query.format === 'xlsx') {
            const xlsx = await this.toXlsx(tripLogs);

            return {
                contentType:
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                fileName: this.buildFileName(query, 'xlsx'),
                content: xlsx,
            };
        }

        const csv = this.toCsv(tripLogs);

        return {
            contentType: 'text/csv; charset=utf-8',
            fileName: this.buildFileName(query, 'csv'),
            content: `\uFEFF${csv}`,
        };
    }

    private buildFileName(
        query: ExportTripLogsQueryDto,
        extension: 'csv' | 'xlsx',
    ) {
        const from = query.from ? query.from.slice(0, 10) : 'all';
        const to = query.to ? query.to.slice(0, 10) : 'all';

        return `trip-logs-${from}-${to}.${extension}`;
    }

    private toCsv(tripLogs: any[]) {
        const rows = [
            [
                'Date',
                'Vehicle',
                'License plate',
                'Member',
                'E-mail',
                'Origin',
                'Destination',
                'Purpose',
                'Odometer start km',
                'Odometer end km',
                'Distance km',
                'Refueled',
                'Refueling cost',
                'Completed at',
            ],
            ...tripLogs.map((tripLog) => [
                this.formatDate(tripLog.reservation.startAt),
                tripLog.reservation.vehicle.name,
                tripLog.reservation.vehicle.licensePlate,
                tripLog.reservation.membership.user.name,
                tripLog.reservation.membership.user.email,
                tripLog.reservation.origin,
                tripLog.reservation.destination,
                tripLog.reservation.purpose,
                tripLog.odometerStartKm,
                tripLog.odometerEndKm,
                tripLog.distanceKm,
                tripLog.refueled ? 'yes' : 'no',
                tripLog.refuelingCost ?? '',
                tripLog.completedAt.toISOString(),
            ]),
        ];

        return rows.map((row) => row.map((value) => this.escapeCsv(value)).join(';')).join('\n');
    }

    private async toXlsx(tripLogs: any[]) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Trip logs');

        worksheet.columns = [
            { header: 'Date', key: 'date', width: 14 },
            { header: 'Vehicle', key: 'vehicleName', width: 24 },
            { header: 'License plate', key: 'licensePlate', width: 16 },
            { header: 'Member', key: 'memberName', width: 24 },
            { header: 'E-mail', key: 'memberEmail', width: 30 },
            { header: 'Origin', key: 'origin', width: 20 },
            { header: 'Destination', key: 'destination', width: 20 },
            { header: 'Purpose', key: 'purpose', width: 30 },
            { header: 'Odometer start km', key: 'odometerStartKm', width: 20 },
            { header: 'Odometer end km', key: 'odometerEndKm', width: 20 },
            { header: 'Distance km', key: 'distanceKm', width: 16 },
            { header: 'Refueled', key: 'refueled', width: 14 },
            { header: 'Refueling cost', key: 'refuelingCost', width: 18 },
            { header: 'Completed at', key: 'completedAt', width: 26 },
        ];

        worksheet.getRow(1).font = {
            bold: true,
        };

        for (const tripLog of tripLogs) {
            worksheet.addRow({
                date: this.formatDate(tripLog.reservation.startAt),
                vehicleName: tripLog.reservation.vehicle.name,
                licensePlate: tripLog.reservation.vehicle.licensePlate,
                memberName: tripLog.reservation.membership.user.name,
                memberEmail: tripLog.reservation.membership.user.email,
                origin: tripLog.reservation.origin,
                destination: tripLog.reservation.destination,
                purpose: tripLog.reservation.purpose,
                odometerStartKm: tripLog.odometerStartKm,
                odometerEndKm: tripLog.odometerEndKm,
                distanceKm: tripLog.distanceKm,
                refueled: tripLog.refueled ? 'yes' : 'no',
                refuelingCost: tripLog.refuelingCost
                    ? Number(tripLog.refuelingCost)
                    : null,
                completedAt: tripLog.completedAt.toISOString(),
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return Buffer.from(buffer);
    }

    private escapeCsv(value: unknown) {
        const text = String(value ?? '');

        if (
            text.includes(';') ||
            text.includes('"') ||
            text.includes('\n') ||
            text.includes('\r')
        ) {
            return `"${text.replace(/"/g, '""')}"`;
        }

        return text;
    }

    private formatDate(value: Date) {
        return value.toISOString().slice(0, 10);
    }
}