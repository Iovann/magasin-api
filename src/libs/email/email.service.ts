import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from './template.service';

@Injectable()
export class EmailService {
    private readonly transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);
    private readonly emailFrom: string;

    constructor(private readonly configService: ConfigService, private readonly templateService: TemplateService) {
        this.emailFrom = this.configService.get<string>('EMAIL_FROM') || 'MagasinX <magasinx@gmail.com>';


        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.emailFrom,
                pass: this.configService.get<string>('GOOGLE_APP_PASSWORD'),
            },
        });

        this.verifyConnection();
    }

    private async verifyConnection(): Promise<void> {
        try {
            await this.transporter.verify();
            this.logger.log('SMTP Server is ready to take our messages');
        } catch (error) {
            this.logger.error('Could not connect to SMTP server', error.stack);
            throw new Error('SMTP connection failed');
        }
    }

    async sendMail(to: string, subject: string, html: string): Promise<boolean> {
        const context = { to, subject };

        try {
            this.logger.debug(`Sending email to: ${to}`, { context });

            const info = await this.transporter.sendMail({
                from: `"MagasinX" <${this.emailFrom}>`,
                to,
                subject,
                html,
            });

            this.logger.log(`Email sent: ${info.messageId}`, {
                context: {
                    ...context,
                    messageId: info.messageId,
                    envelope: info.envelope
                }
            });

            return true;
        } catch (error) {
            this.logger.error(`ERR_EMAIL_SEND_EMAIL: Failed to send email to ${to}`, {
                error: {
                    message: error.message,
                    stack: error.stack,
                    code: error.code,
                },
                context
            });

            return false;
        }
    }

    async sendWelcomeEmail(email: string, name: string, role: string) {
        try {
            this.logger.debug(`Sending welcome email to: ${email}`, { email, name, role });
            const html = await this.templateService.render('welcome', {
                name,
                email,
                role,
                currentYear: new Date().getFullYear()
            });

            return this.sendMail(
                email,
                'Bienvenue sur MagasinX',
                html
            );
        } catch (error) {
            this.logger.error(`ERR_EMAIL_SEND_WELCOME_EMAIL: Failed to send welcome email to ${email}`, {
                error: {
                    message: error.message,
                    stack: error.stack,
                    code: error.code,
                },
                context: { email, name, role }
            });
            return false;
        }
    }

}