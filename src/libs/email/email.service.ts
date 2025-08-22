import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { ConfigService } from "@nestjs/config";
import { TemplateService } from "./template.service";

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly emailFrom: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    this.emailFrom =
      this.configService.get<string>("EMAIL_FROM") ||
      "MagasinX <magasinx@gmail.com>";

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: this.emailFrom,
        pass: this.configService.get<string>("GOOGLE_APP_PASSWORD"),
      },
    });

    this.verifyConnection();
  }

  /**
   * Verifies the connection to the SMTP server.
   * @returns A Promise that resolves when the connection is verified.
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log("SMTP Server is ready to take our messages");
    } catch (error) {
      this.logger.error("Could not connect to SMTP server", error.stack);
      throw new Error("SMTP connection failed");
    }
  }

  /**
   * Sends an email to the specified recipient.
   * @param to The recipient's email address.
   * @param subject The subject of the email.
   * @param html The HTML content of the email.
   * @returns A Promise that resolves to true when the email is sent successfully.
   */
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
          envelope: info.envelope,
        },
      });

      return true;
    } catch (error) {
      const errorMessage = `ERR_EMAIL_SEND_EMAIL: Failed to send email to ${to}`;
      this.logger.error(errorMessage, {
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
        },
        context,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Sends a welcome email to the specified recipient.
   * @param email The recipient's email address.
   * @param name The name of the recipient.
   * @param role The role of the recipient.
   * @param password The password of the recipient.
   * @returns A Promise that resolves to true when the email is sent successfully.
   */
  async sendWelcomeEmail(
    email: string,
    name: string,
    role: string,
    password: string,
  ) {
    try {
      this.logger.debug(`Sending welcome email to: ${email}`, {
        email,
        name,
        role,
      });
      const html = await this.templateService.render("welcome", {
        name,
        email,
        role,
        password,
        currentYear: new Date().getFullYear(),
      });

      return await this.sendMail(email, "Bienvenue sur MagasinX", html);
    } catch (error) {
      const errorMessage = `ERR_EMAIL_SEND_WELCOME_EMAIL: Failed to send welcome email to ${email}`;
      this.logger.error(errorMessage, {
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
        },
        context: { email, name, role },
      });
      throw new Error(errorMessage);
    }
  }
}
