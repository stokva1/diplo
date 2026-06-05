import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly configService: ConfigService) {
    }

    private createTransporter() {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = Number(this.configService.get<string>('SMTP_PORT') ?? 465);
        const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (!host || !user || !pass) {
            throw new Error('SMTP configuration is missing.');
        }

        return nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass,
            },
        });
    }

    async sendPasswordResetEmail(params: {
        to: string;
        name: string;
        token: string;
    }) {
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') ??
            'http://localhost:3001';

        const from =
            this.configService.get<string>('MAIL_FROM') ??
            this.configService.get<string>('SMTP_USER');

        const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(
            params.token,
        )}`;

        const transporter = this.createTransporter();

        await transporter.sendMail({
            from,
            to: params.to,
            subject: 'Password reset',
            text:
                `Hello,\n\n` +
                `To reset your password, click the following link:\n\n` +
                `${resetUrl}\n\n` +
                `This link is valid for 1 hour.\n\n` +
                `If you did not request a password reset, you can ignore this email.`,
            html: `
                <p>Hello,</p>
        
                <p>To reset your password, click the following link:</p>
        
                <p>
                    <a href="${resetUrl}">Reset password</a>
                </p>
        
                <p>This link is valid for 1 hour.</p>
        
                <p>If you did not request a password reset, you can ignore this email.</p>
            `,
        });

        this.logger.log(`Password reset e-mail sent to ${params.to}`);
    }

    async sendInvitationEmail(params: {
        to: string;
        name?: string | null;
        organizationName: string;
        token: string;
    }) {
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') ??
            'http://localhost:3001';

        const from =
            this.configService.get<string>('MAIL_FROM') ??
            this.configService.get<string>('SMTP_USER');

        const invitationUrl = `${frontendUrl}/accept-invitation?token=${encodeURIComponent(
            params.token,
        )}`;

        const displayName = params.name ?? params.to;

        const transporter = this.createTransporter();

        await transporter.sendMail({
            from,
            to: params.to,
            subject: `Invitation to ${params.organizationName}`,
            text:
                `Hello ${displayName},\n\n` +
                `You have been invited to join ${params.organizationName}.\n\n` +
                `To accept the invitation and set your password, click the following link:\n\n` +
                `${invitationUrl}\n\n` +
                `This invitation link is time-limited.\n\n` +
                `If you did not expect this invitation, you can ignore this email.`,
            html: `
            <p>Hello ${displayName},</p>

            <p>You have been invited to join <strong>${params.organizationName}</strong>.</p>

            <p>To accept the invitation and set your password, click the following link:</p>

            <p>
                <a href="${invitationUrl}">Accept invitation</a>
            </p>

            <p>This invitation link is time-limited.</p>

            <p>If you did not expect this invitation, you can ignore this email.</p>
        `,
        });
    }
}