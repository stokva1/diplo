import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {Prisma, PrismaClient} from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PASSWORD = 'tajne-heslo';
const INVITATION_TOKEN = 'seed-invitation-token';
const PASSWORD_RESET_TOKEN = 'seed-password-reset-token';

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function clearDatabase() {
    await prisma.vehicleIssueAttachment.deleteMany();
    await prisma.tripLog.deleteMany();
    await prisma.vehicleIssue.deleteMany();
    await prisma.serviceEvent.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.fileAttachment.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.organizationSettings.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
}

async function main() {
    console.log('Clearing database...');
    await clearDatabase();

    console.log('Creating users...');
    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    const adminUser = await prisma.user.create({
        data: {
            email: 'petr.svoboda@firma.cz',
            name: 'Petr Svoboda',
            passwordHash,
        },
    });

    const activeMemberUser = await prisma.user.create({
        data: {
            email: 'jana.novakova@firma.cz',
            name: 'Jana Novakova',
            passwordHash,
        },
    });

    const disabledMemberUser = await prisma.user.create({
        data: {
            email: 'disabled.user@firma.cz',
            name: 'Disabled User',
            passwordHash,
        },
    });

    console.log('Creating organization...');
    const organization = await prisma.organization.create({
        data: {
            name: 'Firma DEF s.r.o.',
            ico: '87654321',
            contactEmail: 'info@firmadef.cz',
        },
    });

    await prisma.organizationSettings.create({
        data: {
            organizationId: organization.id,
            tripLogRetentionMonths: 60,
            issuePhotoRetentionMonths: 24,
        },
    });

    console.log('Creating memberships...');
    const adminMembership = await prisma.membership.create({
        data: {
            organizationId: organization.id,
            userId: adminUser.id,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    });

    const activeMembership = await prisma.membership.create({
        data: {
            organizationId: organization.id,
            userId: activeMemberUser.id,
            role: 'MEMBER',
            status: 'ACTIVE',
        },
    });

    await prisma.membership.create({
        data: {
            organizationId: organization.id,
            userId: disabledMemberUser.id,
            role: 'MEMBER',
            status: 'DISABLED',
        },
    });

    console.log('Creating vehicles...');
    const octavia = await prisma.vehicle.create({
        data: {
            organizationId: organization.id,
            name: 'Skoda Octavia',
            licensePlate: '1AB 2345',
            brand: 'Skoda',
            model: 'Octavia kombi',
            vin: 'TMB123456789',
            fuelType: 'PETROL',
            currentOdometerKm: 84520,
            status: 'ACTIVE',
            managerMembershipId: adminMembership.id,
            note: 'Testovaci vozidlo spravovane adminem',
        },
    });

    const i30 = await prisma.vehicle.create({
        data: {
            organizationId: organization.id,
            name: 'Hyundai i30',
            licensePlate: '3AB 3333',
            brand: 'Hyundai',
            model: 'i30 kombi',
            vin: 'HYUNDAII30123456',
            fuelType: 'DIESEL',
            currentOdometerKm: 51200,
            status: 'ACTIVE',
            managerMembershipId: activeMembership.id,
            note: 'Testovaci vozidlo spravovane beznym clenem',
        },
    });

    await prisma.vehicle.create({
        data: {
            organizationId: organization.id,
            name: 'VW Caddy',
            licensePlate: '4AB 4444',
            brand: 'Volkswagen',
            model: 'Caddy',
            vin: 'VWLCADDY1234567',
            fuelType: 'DIESEL',
            currentOdometerKm: 90200,
            status: 'UNAVAILABLE',
            managerMembershipId: adminMembership.id,
            note: 'Docasne nedostupne vozidlo',
        },
    });

    await prisma.vehicle.create({
        data: {
            organizationId: organization.id,
            name: 'Skoda Fabia',
            licensePlate: '2AB 2222',
            brand: 'Skoda',
            model: 'Fabia',
            vin: 'TMBFABIA123456',
            fuelType: 'PETROL',
            currentOdometerKm: 30000,
            status: 'ARCHIVED',
            archivedAt: new Date(),
            note: 'Archivovane testovaci vozidlo',
        },
    });

    console.log('Creating file metadata...');
    const receiptFile = await prisma.fileAttachment.create({
        data: {
            organizationId: organization.id,
            uploadedByMembershipId: adminMembership.id,
            fileName: 'seed-fuel-receipt.pdf',
            mimeType: 'application/pdf',
            fileSizeBytes: 128,
            purpose: 'FUEL_RECEIPT',
            storageKey: 'uploads/seed-fuel-receipt.pdf',
        },
    });

    const issuePhoto = await prisma.fileAttachment.create({
        data: {
            organizationId: organization.id,
            uploadedByMembershipId: activeMembership.id,
            fileName: 'seed-issue-photo.png',
            mimeType: 'image/png',
            fileSizeBytes: 128,
            purpose: 'ISSUE_PHOTO',
            storageKey: 'uploads/seed-issue-photo.png',
        },
    });

    const serviceInvoice = await prisma.fileAttachment.create({
        data: {
            organizationId: organization.id,
            uploadedByMembershipId: adminMembership.id,
            fileName: 'seed-service-invoice.pdf',
            mimeType: 'application/pdf',
            fileSizeBytes: 128,
            purpose: 'SERVICE_INVOICE',
            storageKey: 'uploads/seed-service-invoice.pdf',
        },
    });

    console.log('Creating reservations...');
    await prisma.reservation.create({
        data: {
            vehicleId: octavia.id,
            membershipId: adminMembership.id,
            startAt: new Date('2026-06-14T06:00:00.000Z'),
            endAt: new Date('2026-06-14T10:00:00.000Z'),
            origin: 'Praha',
            destination: 'Brno',
            purpose: 'Budouci testovaci rezervace',
            status: 'ACTIVE',
        },
    });

    await prisma.reservation.create({
        data: {
            vehicleId: octavia.id,
            membershipId: adminMembership.id,
            startAt: new Date('2026-06-12T12:15:00.000Z'),
            endAt: new Date('2026-06-12T14:00:00.000Z'),
            origin: 'Praha',
            destination: 'Plzen',
            purpose: 'Zrusena testovaci rezervace',
            status: 'CANCELLED',
            cancelledAt: new Date('2026-05-27T12:27:57.614Z'),
            cancelledByMembershipId: adminMembership.id,
        },
    });

    const finishedReservation = await prisma.reservation.create({
        data: {
            vehicleId: octavia.id,
            membershipId: adminMembership.id,
            startAt: new Date('2026-05-26T08:00:00.000Z'),
            endAt: new Date('2026-05-26T10:00:00.000Z'),
            origin: 'Praha',
            destination: 'Ostrava',
            purpose: 'Dokoncena rezervace s knihou jizd',
            status: 'ACTIVE',
        },
    });

    await prisma.reservation.create({
        data: {
            vehicleId: octavia.id,
            membershipId: adminMembership.id,
            startAt: new Date('2026-05-27T08:00:00.000Z'),
            endAt: new Date('2026-05-27T10:00:00.000Z'),
            origin: 'Praha',
            destination: 'Liberec',
            purpose: 'Chybejici kniha jizd',
            status: 'ACTIVE',
        },
    });

    await prisma.reservation.create({
        data: {
            vehicleId: i30.id,
            membershipId: activeMembership.id,
            startAt: new Date('2026-06-18T08:00:00.000Z'),
            endAt: new Date('2026-06-18T11:00:00.000Z'),
            origin: 'Praha',
            destination: 'Hradec Kralove',
            purpose: 'Budouci rezervace bezneho clena',
            status: 'ACTIVE',
        },
    });

    console.log('Creating trip log...');
    await prisma.tripLog.create({
        data: {
            reservationId: finishedReservation.id,
            odometerStartKm: 84250,
            odometerEndKm: 84520,
            refueled: true,
            refuelingCost: 1200,
            refuelingReceiptFileId: receiptFile.id,
            note: 'Vse v poradku',
            completedByMembershipId: adminMembership.id,
        },
    });

    console.log('Creating issues...');
    const resolvedIssue = await prisma.vehicleIssue.create({
        data: {
            vehicleId: octavia.id,
            reservationId: finishedReservation.id,
            reportedByMembershipId: adminMembership.id,
            description: 'Auto pri brzdeni vydava divny zvuk.',
            status: 'RESOLVED',
            resolvedByMembershipId: adminMembership.id,
            resolvedAt: new Date(),
        },
    });

    await prisma.vehicleIssueAttachment.create({
        data: {
            vehicleIssueId: resolvedIssue.id,
            fileAttachmentId: issuePhoto.id,
        },
    });

    await prisma.vehicleIssue.create({
        data: {
            vehicleId: octavia.id,
            reportedByMembershipId: activeMembership.id,
            description: 'Sviti kontrolka tlaku v pneumatikach.',
            status: 'OPEN',
        },
    });

    console.log('Creating service events...');
    await prisma.serviceEvent.create({
        data: {
            vehicleId: octavia.id,
            createdByMembershipId: adminMembership.id,
            title: 'Vymena oleje',
            description: 'Pravidelny servis',
            startAt: new Date('2026-06-13T06:00:00.000Z'),
            endAt: new Date('2026-06-13T10:00:00.000Z'),
            cost: 4200,
            invoiceFileId: serviceInvoice.id,
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledByMembershipId: adminMembership.id,
        },
    });

    await prisma.serviceEvent.create({
        data: {
            vehicleId: octavia.id,
            createdByMembershipId: adminMembership.id,
            title: 'Kontrola brzd',
            description: 'Aktivni servisni udalost',
            startAt: new Date('2026-06-16T06:00:00.000Z'),
            endAt: new Date('2026-06-16T10:00:00.000Z'),
            cost: 2500,
            status: 'ACTIVE',
        },
    });

    console.log('Creating invitation and password reset token...');
    await prisma.invitation.create({
        data: {
            organizationId: organization.id,
            email: 'pozvany.clen@firma.cz',
            name: 'Pozvany Clen',
            tokenHash: hashToken(INVITATION_TOKEN),
            expiresAt: new Date('2026-12-31T23:59:59.000Z'),
            createdById: adminMembership.id,
        },
    });

    await prisma.passwordResetToken.create({
        data: {
            userId: activeMemberUser.id,
            tokenHash: hashToken(PASSWORD_RESET_TOKEN),
            expiresAt: new Date('2026-12-31T23:59:59.000Z'),
        },
    });

    await prisma.auditLog.create({
        data: {
            organizationId: organization.id,
            actorMembershipId: adminMembership.id,
            action: 'SEED_CREATED',
            entityType: 'Organization',
            entityId: organization.id,
            oldValues: Prisma.JsonNull,
            newValues: { name: organization.name },
        },
    });

    console.log('');
    console.log('Seed completed.');
    console.log('');
    console.log('Admin login:');
    console.log('  email: petr.svoboda@firma.cz');
    console.log(`  password: ${PASSWORD}`);
    console.log('');
    console.log('Active member login:');
    console.log('  email: jana.novakova@firma.cz');
    console.log(`  password: ${PASSWORD}`);
    console.log('');
    console.log('Disabled member login:');
    console.log('  email: disabled.user@firma.cz');
    console.log(`  password: ${PASSWORD}`);
    console.log('');
    console.log('Invitation token:');
    console.log(`  ${INVITATION_TOKEN}`);
    console.log('');
    console.log('Password reset token for jana.novakova@firma.cz:');
    console.log(`  ${PASSWORD_RESET_TOKEN}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
